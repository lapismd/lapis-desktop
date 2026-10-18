use super::{
    NativeBackends, denied,
    frames::{Operation, Reply, Request},
    revoke,
};
use crate::host::state::{NativeError, NativeHost};
use std::{io, sync::Arc};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_lapis_ai::{AcpHost, AiExt, HostContext};

pub(super) async fn dispatch(
    backends: Arc<NativeBackends>,
    host: NativeHost,
    workers: Arc<AcpHost>,
    context: HostContext,
    text: String,
) -> io::Result<String> {
    super::super::policy::local(&context).map_err(|_| denied())?;
    let request = Request::decode(&text)?;
    let transition = backends.transitions.clone().lock_owned().await;
    if let Operation::Close { handle } = &request.operation {
        if let Some(generation) = backends.closing(&context.window, &request.session_id, *handle)? {
            revoke(&workers, &backends, &context.window, Some(&generation)).await?;
        }
        return Reply::Closed.encode();
    }
    let owner = backends.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _transition = transition;
        let (profiles, _) = owner.profiles(&host, &context, &request.session_id)?;
        let reply = match request.operation {
            Operation::Read {} => Reply::Selection(profiles.read()?),
            Operation::Select {
                request_id,
                expected_revision,
                backend,
            } => Reply::Receipt(Some(profiles.select(
                request_id,
                expected_revision,
                backend,
            )?)),
            Operation::Status { request_id } => Reply::Receipt(profiles.status(request_id)?),
            Operation::Open { request_id } => {
                Reply::Opened(owner.open(&host, &context, &request.session_id, request_id)?)
            }
            Operation::PrepareConversation {
                handle,
                request_id,
                title,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::Conversation(Some(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::prepare(call, request_id, title),
                )?))
            }
            Operation::ConversationStatus { handle, request_id } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::Conversation(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::status(call, request_id),
                )?)
            }
            Operation::Close { .. } => return Err(denied()),
        };
        reply.encode()
    })
    .await
    .map_err(|_| io::Error::other("Conversation backend outcome is unknown"))?
}

#[tauri::command]
pub async fn desktop_ai_backends(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    backends: tauri::State<'_, Arc<NativeBackends>>,
    request: String,
) -> Result<String, NativeError> {
    let context = super::super::policy::caller(&window).map_err(|_| denied())?;
    dispatch(
        backends.inner().clone(),
        host.inner().clone(),
        window.app_handle().ai(),
        context,
        request,
    )
    .await
    .map_err(Into::into)
}
