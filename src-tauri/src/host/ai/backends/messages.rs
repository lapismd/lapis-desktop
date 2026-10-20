use super::{NativeBackends, denied};
use crate::host::state::NativeHost;
use jj_store_model::RequestId;
use lapis_desktop::ai::conversations::messages::{self, MessageWrite};
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

pub(super) struct MessageInput {
    pub conversation: RequestId,
    pub request: RequestId,
    pub text: String,
}
impl NativeBackends {
    pub(super) fn append_message(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        handle: Uuid,
        input: MessageInput,
    ) -> io::Result<MessageWrite> {
        let call = self.conversation_call(host, context, session, handle)?;
        let privacy = self
            .privacy
            .get()
            .ok_or_else(denied)?
            .for_workspace(&call.workspace_root()?, &[])?;
        tauri::async_runtime::block_on(messages::append(
            call,
            input.conversation,
            input.request,
            input.text,
            privacy.sanitizer.clone(),
        ))
    }
}
