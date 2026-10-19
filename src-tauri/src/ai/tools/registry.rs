//! Reserved request identities retain late setup and failed cleanup ownership.
use super::{Authorize, Binding, Event, EventSink, Limits, ToolSpec, unavailable};
use std::{
    collections::HashMap,
    io,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use tokio::sync::watch;
use uuid::Uuid;

#[derive(Clone, PartialEq, Eq)]
pub struct Owner {
    pub window: String,
    pub session: String,
    pub generation: String,
}
struct Entry {
    owner: Owner,
    fenced: Arc<AtomicBool>,
    ready: watch::Receiver<Option<Result<Arc<Binding>, ()>>>,
    claimed: AtomicBool,
}
#[derive(Default)]
struct State {
    seen: HashMap<Uuid, Owner>,
    entries: HashMap<Uuid, Arc<Entry>>,
}
#[derive(Default)]
pub struct Registry {
    state: Mutex<State>,
}
impl Registry {
    pub async fn open(
        &self,
        request: Uuid,
        owner: Owner,
        tools: Vec<ToolSpec>,
        authorize: Authorize,
        sink: EventSink,
    ) -> io::Result<()> {
        authorize()?;
        let (published, ready) = watch::channel(None);
        let entry = {
            let mut state = self.state.lock().map_err(|_| unavailable())?;
            if state.seen.contains_key(&request)
                || state.seen.len() >= 4096
                || state.entries.len() >= 8
            {
                return Err(unavailable());
            }
            let entry = Arc::new(Entry {
                owner: owner.clone(),
                fenced: Arc::new(AtomicBool::new(false)),
                ready,
                claimed: AtomicBool::new(false),
            });
            state.seen.insert(request, owner);
            state.entries.insert(request, entry.clone());
            entry
        };
        let preparing = entry.clone();
        // Setup is owned even if the original renderer/native command loses its reply.
        tokio::spawn(async move {
            let fenced = preparing.fenced.clone();
            let authorize: Authorize = Arc::new(move || {
                if fenced.load(Ordering::SeqCst) {
                    return Err(unavailable());
                }
                authorize()
            });
            let sink: EventSink = Arc::new(move |event| {
                sink(match event {
                    Event::Call {
                        invocation_id,
                        turn_id,
                        name,
                        arguments,
                        ..
                    } => Event::Call {
                        bridge_id: request,
                        invocation_id,
                        turn_id,
                        name,
                        arguments,
                    },
                    Event::Cancel { invocation_id, .. } => Event::Cancel {
                        bridge_id: request,
                        invocation_id,
                    },
                })
            });
            let opened = Binding::open(tools, authorize, sink, Limits::default())
                .await
                .map_err(|_| ());
            if preparing.fenced.load(Ordering::SeqCst)
                && let Ok(binding) = &opened
            {
                let _ = binding.fence();
            }
            published.send_replace(Some(opened));
        });
        Self::wait(&entry).await?.check()
    }
    async fn wait(entry: &Entry) -> io::Result<Arc<Binding>> {
        let mut ready = entry.ready.clone();
        loop {
            if let Some(result) = ready.borrow_and_update().clone() {
                return result.map_err(|_| unavailable());
            }
            ready.changed().await.map_err(|_| unavailable())?;
        }
    }
    pub fn binding(&self, request: Uuid, owner: &Owner) -> io::Result<Arc<Binding>> {
        let state = self.state.lock().map_err(|_| unavailable())?;
        let entry = state
            .entries
            .get(&request)
            .filter(|entry| entry.owner == *owner)
            .ok_or_else(unavailable)?;
        let result = entry.ready.borrow().clone();
        result.ok_or_else(unavailable)?.map_err(|_| unavailable())
    }
    /// An admitted alias belongs to exactly one ACP worker, including lost opens.
    pub fn claim(&self, request: Uuid, owner: &Owner) -> io::Result<Arc<Binding>> {
        let binding = self.binding(request, owner)?;
        binding.check()?;
        let state = self.state.lock().map_err(|_| unavailable())?;
        let entry = state.entries.get(&request).ok_or_else(unavailable)?;
        entry
            .claimed
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .map_err(|_| unavailable())?;
        Ok(binding)
    }
    /// Closing uses the original window/session, even after its generation expired.
    pub async fn close(&self, request: Uuid, window: &str, session: &str) -> io::Result<()> {
        let entry = {
            let state = self.state.lock().map_err(|_| unavailable())?;
            state
                .seen
                .get(&request)
                .filter(|o| o.window == window && o.session == session)
                .ok_or_else(unavailable)?;
            state.entries.get(&request).cloned()
        };
        if let Some(entry) = entry {
            entry.fenced.store(true, Ordering::SeqCst);
            if let Ok(binding) = Self::wait(&entry).await {
                binding.close().await?;
            }
            self.state
                .lock()
                .map_err(|_| unavailable())?
                .entries
                .remove(&request);
        }
        Ok(())
    }
    pub fn fence(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        let entries = self
            .state
            .lock()
            .map_err(|_| unavailable())?
            .entries
            .values()
            .filter(|e| {
                e.owner.window == window && generation.is_none_or(|g| g == e.owner.generation)
            })
            .cloned()
            .collect::<Vec<_>>();
        for entry in entries {
            entry.fenced.store(true, Ordering::SeqCst);
            if let Some(Ok(binding)) = entry.ready.borrow().as_ref() {
                binding.fence()?;
            }
        }
        Ok(())
    }
    pub async fn drain(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        self.fence(window, generation)?;
        let entries = self
            .state
            .lock()
            .map_err(|_| unavailable())?
            .entries
            .iter()
            .filter(|(_, e)| {
                e.owner.window == window && generation.is_none_or(|g| g == e.owner.generation)
            })
            .map(|(id, e)| (*id, e.owner.session.clone()))
            .collect::<Vec<_>>();
        for (id, session) in entries {
            self.close(id, window, &session).await?;
        }
        Ok(())
    }
    pub fn original(&self, request: Uuid, window: &str, session: &str) -> io::Result<Arc<Binding>> {
        let state = self.state.lock().map_err(|_| unavailable())?;
        let entry = state
            .entries
            .get(&request)
            .filter(|e| e.owner.window == window && e.owner.session == session)
            .ok_or_else(unavailable)?;
        let result = entry.ready.borrow().clone();
        result.ok_or_else(unavailable)?.map_err(|_| unavailable())
    }
}
impl Drop for Registry {
    fn drop(&mut self) {
        if let Ok(state) = self.state.get_mut() {
            for entry in state.entries.values() {
                entry.fenced.store(true, Ordering::SeqCst);
                if let Some(Ok(binding)) = entry.ready.borrow().as_ref() {
                    let _ = binding.fence();
                }
            }
        }
    }
}
