use super::{Event, EventSink, unavailable};
use std::{io, sync::Mutex};

/// Release platform event handles on fence, including an unknown effect drain.
pub(super) struct Events(Mutex<Option<EventSink>>);
impl Events {
    pub fn new(sink: EventSink) -> Self {
        Self(Mutex::new(Some(sink)))
    }
    pub fn send(&self, event: Event) -> io::Result<bool> {
        let sink = self.0.lock().map_err(|_| unavailable())?.clone();
        let Some(sink) = sink else {
            return Ok(false);
        };
        sink(event)?;
        Ok(true)
    }
    pub fn close(&self) -> io::Result<()> {
        self.0.lock().map_err(|_| unavailable())?.take();
        Ok(())
    }
}
