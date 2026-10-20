use super::{
    NativeBackends, denied,
    frames::{Operation, Reply, Request},
    revoke,
};
use crate::host::state::NativeHost;
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::{AcpHost, HostContext};

pub(super) async fn dispatch(
    backends: Arc<NativeBackends>,
    host: NativeHost,
    workers: Arc<AcpHost>,
    context: HostContext,
    text: String,
) -> io::Result<String> {
    super::super::policy::local(&context).map_err(|_| denied())?;
    let request = tauri::async_runtime::spawn_blocking(move || Request::decode(&text))
        .await
        .map_err(|_| io::Error::other("Conversation frame worker unavailable"))??;
    let transition = backends.transitions.clone().lock_owned().await;
    if let Operation::Close { handle } = &request.operation {
        if let Some(generation) = backends.closing(&context.window, &request.session_id, *handle)? {
            revoke(&workers, &backends, &context.window, Some(&generation)).await?;
        }
        return Reply::Closed.encode();
    }
    if let Operation::StopCanonicalDispatch {
        handle,
        request_id,
        thread_id,
    } = &request.operation
    {
        return super::dispatch::stop(
            backends,
            host,
            workers,
            context,
            request.session_id,
            super::dispatch::StopRequest {
                handle: *handle,
                request: *request_id,
                thread: *thread_id,
            },
            transition,
        )
        .await;
    }
    let owner = backends.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _transition = transition;
        #[cfg(test)]
        owner
            .blocking_started
            .fetch_add(1, std::sync::atomic::Ordering::Release);
        let (profiles, _) = owner.profiles(&host, &context, &request.session_id)?;
        let reply = match request.operation {
            operation @ (Operation::BeginCanonicalDispatch { .. }
            | Operation::CanonicalDispatchStatus { .. }
            | Operation::FenceCanonicalDispatch { .. }) => {
                owner.dispatch_command(&host, &context, &request.session_id, operation)?
            }
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
            Operation::ListConversations { handle, cursor } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::ConversationCatalog(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::catalog::list(call, cursor),
                )?)
            }
            Operation::EditCanonicalConversation { handle, edit } => Reply::ConversationEdit(Some(
                owner.edit_conversation(&host, &context, &request.session_id, handle, edit)?,
            )),
            Operation::CanonicalConversationEditStatus {
                handle,
                request_id,
                thread_id,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::ConversationEdit(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::edits::status(call, request_id, thread_id),
                )?)
            }
            Operation::AppendConversationMessage {
                handle,
                request_id,
                conversation_request_id,
                text,
            } => Reply::ConversationMessage(Some(owner.append_message(
                &host,
                &context,
                &request.session_id,
                handle,
                super::messages::MessageInput {
                    conversation: conversation_request_id,
                    request: request_id,
                    text,
                },
            )?)),
            Operation::ConversationMessageStatus {
                handle,
                request_id,
                conversation_request_id,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::ConversationMessage(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::messages::status(
                        call,
                        conversation_request_id,
                        request_id,
                    ),
                )?)
            }
            Operation::PrepareCapture {
                handle,
                request_id,
                conversation_request_id,
            } => Reply::Capture(owner.prepare_capture(
                &host,
                &context,
                &request.session_id,
                handle,
                super::capture::Preparation {
                    request: request_id,
                    conversation: conversation_request_id,
                    client: None,
                },
            )?),
            Operation::AppendCanonicalConversationMessage { handle, message } => {
                Reply::CanonicalConversationMessage(Some(owner.append_canonical_message(
                    &host,
                    &context,
                    &request.session_id,
                    handle,
                    message,
                )?))
            }
            Operation::CanonicalConversationMessageStatus {
                handle,
                request_id,
                thread_id,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::CanonicalConversationMessage(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::messages::canonical::status(
                        call, request_id, thread_id,
                    ),
                )?)
            }
            Operation::PrepareManagedCapture {
                handle,
                request_id,
                conversation_request_id,
                client_id,
            } => Reply::Capture(owner.prepare_capture(
                &host,
                &context,
                &request.session_id,
                handle,
                super::capture::Preparation {
                    request: request_id,
                    conversation: conversation_request_id,
                    client: Some(client_id),
                },
            )?),
            Operation::PrepareCanonicalManagedCapture {
                handle,
                request_id,
                thread_id,
                expected_selection,
                client_id,
                participant,
                dispatch_request_id,
            } => Reply::CanonicalCapture(owner.prepare_canonical_capture(
                &host,
                &context,
                &request.session_id,
                handle,
                super::canonical_capture::Preparation {
                    request: request_id,
                    thread: thread_id,
                    observed: expected_selection,
                    client: client_id,
                    participant,
                    dispatch_request_id,
                },
            )?),
            Operation::ReadConversation { handle, request_id } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::ConversationView(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::read(call, request_id),
                )?)
            }
            Operation::OpenConversationRead { handle, request_id } => {
                Reply::ConversationRead(owner.open_read(
                    &host,
                    &context,
                    &request.session_id,
                    handle,
                    super::reads::Target::Prepared(request_id),
                )?)
            }
            Operation::ReadCanonicalConversation { handle, thread_id } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                Reply::CanonicalConversationView(tauri::async_runtime::block_on(
                    lapis_desktop::ai::conversations::read_canonical(call, thread_id),
                )?)
            }
            Operation::OpenCanonicalConversationRead { handle, thread_id } => {
                Reply::ConversationRead(owner.open_read(
                    &host,
                    &context,
                    &request.session_id,
                    handle,
                    super::reads::Target::Canonical(thread_id),
                )?)
            }
            Operation::ReadConversationTranscript {
                handle,
                read_handle,
                cursor,
                after_sequence,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                let read = owner.read_pin(&context.window, handle, read_handle)?;
                Reply::TranscriptRange(tauri::async_runtime::block_on(read.transcript(
                    call,
                    cursor,
                    after_sequence,
                ))?)
            }
            Operation::CloseConversationRead {
                handle,
                read_handle,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                owner.close_read(&context.window, handle, read_handle)?;
                call.check()?;
                Reply::Closed
            }
            Operation::ReadConversationRecords {
                handle,
                read_handle,
                cursor,
                after_index,
            } => {
                let call = owner.conversation_call(&host, &context, &request.session_id, handle)?;
                let read = owner.read_pin(&context.window, handle, read_handle)?;
                Reply::ConversationRecords(tauri::async_runtime::block_on(read.records(
                    call,
                    cursor,
                    after_index,
                ))?)
            }
            Operation::Close { .. } | Operation::StopCanonicalDispatch { .. } => {
                return Err(denied());
            }
        };
        reply.encode()
    })
    .await
    .map_err(|_| io::Error::other("Conversation backend outcome is unknown"))?
}
