use super::{NativeBackends, denied};
use crate::host::state::NativeHost;
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use lapis_desktop::ai::conversations::ReadPin;
use serde::Serialize;
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

const MAX_READS: usize = 8;
pub(super) enum Target {
    Prepared(RequestId),
    Canonical(ThreadId),
}
#[derive(Serialize)]
pub(super) struct OpenedRead {
    handle: Uuid,
    snapshot: String,
}
impl NativeBackends {
    pub(super) fn open_read(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        handle: Uuid,
        target: Target,
    ) -> io::Result<Option<OpenedRead>> {
        let call = self.conversation_call(host, context, session, handle)?;
        {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get(&context.window)
                .filter(|o| o.opened.handle == handle)
                .ok_or_else(denied)?;
            if owner.reads.len() >= MAX_READS {
                return Err(io::Error::other(
                    "Close an existing conversation read first",
                ));
            }
        }
        let opened = tauri::async_runtime::block_on(async move {
            match target {
                Target::Prepared(request) => {
                    lapis_desktop::ai::conversations::open_read(call, request).await
                }
                Target::Canonical(thread) => {
                    lapis_desktop::ai::conversations::open_canonical(call, thread).await
                }
            }
        })?;
        let Some((snapshot, pin)) = opened else {
            return Ok(None);
        };
        let id = Uuid::new_v4();
        let mut owners = self.owners.lock().map_err(|_| denied())?;
        let owner = owners
            .get_mut(&context.window)
            .filter(|o| o.opened.handle == handle)
            .ok_or_else(denied)?;
        owner.reads.insert(id, Arc::new(pin));
        Ok(Some(OpenedRead {
            handle: id,
            snapshot,
        }))
    }
    pub(super) fn read_pin(
        &self,
        window: &str,
        handle: Uuid,
        read: Uuid,
    ) -> io::Result<Arc<ReadPin>> {
        self.owners
            .lock()
            .map_err(|_| denied())?
            .get(window)
            .filter(|o| o.opened.handle == handle)
            .and_then(|o| o.reads.get(&read))
            .cloned()
            .ok_or_else(denied)
    }
    pub(super) fn close_read(&self, window: &str, handle: Uuid, read: Uuid) -> io::Result<()> {
        let mut owners = self.owners.lock().map_err(|_| denied())?;
        owners
            .get_mut(window)
            .filter(|o| o.opened.handle == handle)
            .ok_or_else(denied)?
            .reads
            .remove(&read);
        Ok(())
    }
}
