use super::{Catalog, Check, denied};
use std::{
    collections::HashMap,
    io,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use tokio::sync::Notify;
use uuid::Uuid;
struct Ticket {
    cancelled: Arc<AtomicBool>,
    started: bool,
}
#[derive(Default)]
struct State {
    closed: bool,
    active: usize,
    tickets: HashMap<Uuid, Ticket>,
}
pub struct ImportScope {
    check: Check,
    state: Mutex<State>,
    changed: Notify,
    pub catalog: Mutex<Catalog>,
}
pub struct ImportWork {
    scope: Arc<ImportScope>,
    id: Uuid,
    cancelled: Arc<AtomicBool>,
}
impl ImportScope {
    pub fn new(check: Check) -> Arc<Self> {
        Arc::new(Self {
            check,
            state: Mutex::new(State::default()),
            changed: Notify::new(),
            catalog: Mutex::new(Catalog::default()),
        })
    }
    pub fn check(&self) -> io::Result<()> {
        (self.check)()?;
        if self.state.lock().map_err(|_| denied())?.closed {
            return Err(denied());
        }
        Ok(())
    }
    /// Preparation precedes worker dispatch, so cancellation can win before start.
    pub fn prepare(&self) -> io::Result<Uuid> {
        self.check()?;
        let mut state = self.state.lock().map_err(|_| denied())?;
        if state.closed || state.tickets.len() >= 16 {
            return Err(denied());
        }
        let id = Uuid::new_v4();
        state.tickets.insert(
            id,
            Ticket {
                cancelled: Arc::new(AtomicBool::new(false)),
                started: false,
            },
        );
        Ok(id)
    }
    pub fn begin(self: &Arc<Self>, id: Uuid) -> io::Result<ImportWork> {
        let mut state = self.state.lock().map_err(|_| denied())?;
        if state.closed || state.active != 0 {
            return Err(denied());
        }
        let ticket = state.tickets.get_mut(&id).ok_or_else(denied)?;
        if ticket.started || ticket.cancelled.load(Ordering::SeqCst) {
            return Err(denied());
        }
        ticket.started = true;
        let cancelled = ticket.cancelled.clone();
        state.active += 1;
        Ok(ImportWork {
            scope: self.clone(),
            id,
            cancelled,
        })
    }
    pub fn cancel(&self, id: Uuid) -> io::Result<()> {
        let mut state = self.state.lock().map_err(|_| denied())?;
        if let Some(ticket) = state.tickets.get(&id) {
            ticket.cancelled.store(true, Ordering::SeqCst);
            if !ticket.started {
                state.tickets.remove(&id);
            }
        }
        Ok(())
    }
    pub fn fence(&self) -> io::Result<()> {
        let mut state = self.state.lock().map_err(|_| denied())?;
        state.closed = true;
        for ticket in state.tickets.values() {
            ticket.cancelled.store(true, Ordering::SeqCst);
        }
        state.tickets.retain(|_, ticket| ticket.started);
        Ok(())
    }
    pub async fn drain(&self) -> io::Result<()> {
        self.fence()?;
        loop {
            let changed = self.changed.notified();
            if self.state.lock().map_err(|_| denied())?.active == 0 {
                return Ok(());
            }
            changed.await;
        }
    }
}
impl ImportWork {
    pub fn check(&self) -> io::Result<()> {
        if self.cancelled.load(Ordering::SeqCst) {
            return Err(denied());
        }
        self.scope.check()
    }
}
impl Drop for ImportWork {
    fn drop(&mut self) {
        if let Ok(mut state) = self.scope.state.lock() {
            state.tickets.remove(&self.id);
            state.active -= 1;
            self.scope.changed.notify_waiters();
        }
    }
}
