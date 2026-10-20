use super::events::Events;
use super::state::{Pending, State};
use super::{Event, Outcome, ToolSpec, files::Files, unavailable, unknown};
use serde_json::Value;
use std::{
    io,
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::sync::{Notify, oneshot, watch};
use uuid::Uuid;

pub type Authorize = Arc<dyn Fn() -> io::Result<()> + Send + Sync>;
pub type EventSink = Arc<dyn Fn(Event) -> io::Result<()> + Send + Sync>;
#[derive(Clone)]
pub struct Limits {
    pub handshake: Duration,
    pub call: Duration,
    pub drain: Duration,
}
impl Default for Limits {
    fn default() -> Self {
        Self {
            handshake: Duration::from_secs(5),
            call: Duration::from_secs(60),
            drain: Duration::from_secs(5),
        }
    }
}
pub struct Binding {
    pub id: Uuid,
    pub(super) tools: Vec<ToolSpec>,
    pub(super) files: Mutex<Option<Files>>,
    pub(super) limits: Limits,
    authorize: Authorize,
    sink: Events,
    state: Mutex<State>,
    changed: Notify,
    pub(super) stop: watch::Sender<bool>,
    listener: tokio::sync::Mutex<Option<tokio::task::JoinHandle<io::Result<()>>>>,
    http: tokio::sync::Mutex<Option<tokio::task::JoinHandle<io::Result<()>>>>,
    closing: tokio::sync::Mutex<()>,
}
impl Binding {
    pub async fn open(
        tools: Vec<ToolSpec>,
        authorize: Authorize,
        sink: EventSink,
        limits: Limits,
    ) -> io::Result<Arc<Self>> {
        authorize()?;
        lapis_ai_app_tools::Config::default()
            .validate(&tools.iter().cloned().map(Into::into).collect::<Vec<_>>())
            .map_err(|_| unavailable())?;
        if [limits.handshake, limits.call, limits.drain]
            .iter()
            .any(|d| d.is_zero() || *d > Duration::from_secs(60))
        {
            return Err(unavailable());
        }
        let mut files = tokio::task::spawn_blocking(Files::create)
            .await
            .map_err(|_| unavailable())??;
        authorize()?;
        let listener =
            tokio::net::UnixListener::from_std(files.listener.take().ok_or_else(unavailable)?)?;
        let binding = Arc::new(Self {
            id: Uuid::new_v4(),
            tools,
            files: Mutex::new(Some(files)),
            limits,
            authorize,
            sink: Events::new(sink),
            state: Mutex::new(State::default()),
            changed: Notify::new(),
            stop: watch::channel(false).0,
            listener: tokio::sync::Mutex::new(None),
            http: tokio::sync::Mutex::new(None),
            closing: tokio::sync::Mutex::new(()),
        });
        let task = tokio::spawn(super::listener::serve(
            Arc::downgrade(&binding),
            listener,
            binding.stop.subscribe(),
        ));
        *binding.listener.lock().await = Some(task);
        *binding.http.lock().await = Some(super::http::start(&binding).await?);
        Ok(binding)
    }
    pub fn arm(&self, turn: Uuid) -> io::Result<()> {
        self.check()?;
        let mut state = self.state.lock().map_err(|_| unavailable())?;
        if state.fenced || state.turn.is_some() || !state.calls.is_empty() {
            return Err(unavailable());
        }
        state.turn = Some(turn);
        Ok(())
    }
    pub async fn end(&self, turn: Uuid) -> io::Result<()> {
        {
            let mut state = self.state.lock().map_err(|_| unavailable())?;
            if state.turn != Some(turn) {
                return Err(unavailable());
            }
            state.turn = None;
        }
        if self.drain().await.is_err() {
            self.fence()?;
            return Err(unknown());
        }
        Ok(())
    }
    pub fn check(&self) -> io::Result<()> {
        (self.authorize)()?;
        if self.state.lock().map_err(|_| unavailable())?.fenced {
            return Err(unavailable());
        }
        Ok(())
    }
    pub(super) fn authenticate(&self, supplied: &str) -> io::Result<()> {
        self.check()?;
        let files = self.files.lock().map_err(|_| unavailable())?;
        let files = files.as_ref().ok_or_else(unavailable)?;
        // Fixed-size comparison avoids early differing-byte exits.
        let secret = files.credential.as_bytes();
        if supplied.len() != secret.len()
            || supplied
                .as_bytes()
                .iter()
                .zip(secret)
                .fold(0u8, |v, (a, b)| v | (a ^ b))
                != 0
        {
            return Err(unavailable());
        }
        Ok(())
    }
    pub(super) fn begin(
        &self,
        name: String,
        arguments: Value,
    ) -> Result<(Uuid, oneshot::Receiver<Outcome>), Outcome> {
        self.check().map_err(|_| Outcome::Rejected {})?;
        let (id, turn, receiver) = {
            let mut state = self.state.lock().map_err(|_| Outcome::Rejected {})?;
            let turn = state
                .turn
                .filter(|_| !state.fenced)
                .ok_or(Outcome::Rejected {})?;
            if state.calls.len() >= 8
                || state.total >= 4096
                || !self.tools.iter().any(|t| t.name == name)
            {
                return Err(Outcome::Rejected {});
            }
            let id = Uuid::new_v4();
            let (sender, receiver) = oneshot::channel();
            state.calls.insert(
                id,
                Pending {
                    reply: sender,
                    cancelled: false,
                },
            );
            state.total += 1;
            (id, turn, receiver)
        };
        let sent = self.sink.send(Event::Call {
            bridge_id: self.id,
            invocation_id: id,
            turn_id: turn,
            name,
            arguments,
        });
        if matches!(sent, Ok(false)) {
            let _ = self.reply(id, Outcome::Rejected {});
            return Err(Outcome::Rejected {});
        }
        if sent.is_err() {
            // Event delivery may have happened: retain execution ownership until an exact reply.
            let _ = self.cancel(id);
            return Err(Outcome::Unknown {});
        }
        Ok((id, receiver))
    }
    pub fn reply(&self, id: Uuid, outcome: Outcome) -> io::Result<()> {
        // The host separately authenticates the original IPC owner, even after fencing.
        let pending = self
            .state
            .lock()
            .map_err(|_| unavailable())?
            .acknowledge(id, &outcome)?;
        if let Some(pending) = pending {
            let _ = pending.reply.send(outcome);
        }
        self.changed.notify_waiters();
        Ok(())
    }
    pub(super) fn cancel(&self, id: Uuid) -> io::Result<()> {
        let emit = {
            let mut state = self.state.lock().map_err(|_| unavailable())?;
            state.calls.get_mut(&id).is_some_and(|p| {
                let emit = !p.cancelled;
                p.cancelled = true;
                emit
            })
        };
        if emit {
            self.sink.send(Event::Cancel {
                bridge_id: self.id,
                invocation_id: id,
            })?;
        }
        Ok(())
    }
    pub fn fence(&self) -> io::Result<()> {
        let calls = {
            let mut state = self.state.lock().map_err(|_| unavailable())?;
            state.fenced = true;
            state.turn = None;
            state.calls.keys().copied().collect::<Vec<_>>()
        };
        self.stop.send_replace(true);
        let mut failure = None;
        for id in calls {
            if let Err(error) = self.cancel(id) {
                failure.get_or_insert(error);
            }
        }
        self.sink.close()?;
        if let Some(error) = failure {
            Err(error)
        } else {
            Ok(())
        }
    }
    async fn drain(&self) -> io::Result<()> {
        tokio::time::timeout(self.limits.drain, async {
            loop {
                let changed = self.changed.notified();
                tokio::pin!(changed);
                changed.as_mut().enable();
                if self
                    .state
                    .lock()
                    .map_err(|_| unavailable())?
                    .calls
                    .is_empty()
                {
                    return Ok(());
                }
                changed.await;
            }
        })
        .await
        .map_err(|_| unknown())?
    }
    pub async fn close(&self) -> io::Result<()> {
        let _closing = self.closing.lock().await;
        self.fence()?;
        self.drain().await?;
        let mut listener = self.listener.lock().await;
        if let Some(task) = listener.as_mut() {
            task.await.map_err(|_| unknown())??;
            listener.take();
        }
        let mut http = self.http.lock().await;
        if let Some(task) = http.as_mut() {
            task.await.map_err(|_| unknown())??;
            http.take();
        }
        let mut files = self.files.lock().map_err(|_| unavailable())?;
        if let Some(owned) = files.as_ref() {
            owned.cleanup()?;
            files.take();
        }
        Ok(())
    }
}
impl Drop for Binding {
    fn drop(&mut self) {
        self.stop.send_replace(true);
    }
}
