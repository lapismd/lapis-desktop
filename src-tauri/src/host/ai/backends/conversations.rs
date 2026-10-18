use super::{NativeBackends, denied};
use crate::host::state::NativeHost;
use lapis_desktop::ai::backend::{Backend, BackendCall};
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

impl NativeBackends {
    /// Commands require active renderer admission and the exact current handle.
    pub(super) fn conversation_call(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        handle: Uuid,
    ) -> io::Result<BackendCall> {
        let lease = self.current(host, &context.window)?;
        if lease.session() != session {
            return Err(denied());
        }
        let scope = self
            .owners
            .lock()
            .map_err(|_| denied())?
            .get(&context.window)
            .filter(|owner| {
                owner.generation == lease.generation()
                    && owner.session == session
                    && !owner.rebindable
                    && owner.opened.handle == handle
                    && owner.scope.selection().revision > 0
                    && owner.scope.selection().backend == Backend::Jj
            })
            .map(|owner| owner.scope.clone())
            .ok_or_else(denied)?;
        scope.begin()
    }
}
