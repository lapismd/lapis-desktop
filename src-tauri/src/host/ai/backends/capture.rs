use super::{NativeBackends, capture_owner::OwnedCapture, denied, managed::Client};
use crate::host::state::NativeHost;
use jj_store_conversations::capture::{Binding, CaptureError};
use jj_store_model::RequestId;
use lapis_desktop::ai::{capture::WorkerProcessor, conversations::PreparedConversation};
use serde::Serialize;
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::{HostContext, SessionBinding, runtime::SessionProcessor};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Prepared {
    pub request_id: RequestId,
    pub conversation_request_id: RequestId,
    pub target_id: Uuid,
}
pub(super) struct Plan {
    pub prepared: Prepared,
    pub(super) context: HostContext,
    pub(super) conversation: Arc<PreparedConversation>,
    pub(super) client: Option<Client>,
    pub(super) claimed: bool,
}
pub(super) struct Preparation {
    pub request: RequestId,
    pub conversation: RequestId,
    pub client: Option<Client>,
}
impl NativeBackends {
    /// Caller owns native transitions through completion, even if IPC disappears.
    pub(super) fn prepare_capture(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        handle: Uuid,
        preparation: Preparation,
    ) -> io::Result<Prepared> {
        let Preparation {
            request,
            conversation,
            client,
        } = preparation;
        let call = self.conversation_call(host, context, session, handle)?;
        lapis_desktop::ai::conversations::dispatch::ensure_unclaimed(&call, request)?;
        let prior = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners.get(&context.window).ok_or_else(denied)?;
            if owner.canonical_captures.contains_key(&request) {
                return Err(denied());
            }
            if let Some(prior) = owner.captures.get(&request) {
                if prior.prepared.conversation_request_id != conversation
                    || prior.context.url != context.url
                    || prior.client != client
                {
                    return Err(denied());
                }
                Some((prior.prepared.clone(), prior.conversation.clone()))
            } else {
                if owner.captures.len() + owner.canonical_captures.len() >= 64 {
                    return Err(super::busy());
                }
                None
            }
        };
        if let Some((prepared, conversation)) = prior {
            conversation.check(&call)?;
            return Ok(prepared);
        }
        let conversation = Arc::new(tauri::async_runtime::block_on(PreparedConversation::load(
            call,
            conversation,
        ))?);
        let current = self.conversation_call(host, context, session, handle)?;
        let prepared = Prepared {
            request_id: request,
            conversation_request_id: {
                // The original caller identity is retained independently of the opaque target.
                conversation.request_id()
            },
            target_id: Uuid::new_v4(),
        };
        let mut owners = self.owners.lock().map_err(|_| denied())?;
        owners
            .get_mut(&context.window)
            .filter(|owner| owner.opened.handle == handle)
            .ok_or_else(denied)?
            .captures
            .insert(
                request,
                Plan {
                    prepared: prepared.clone(),
                    context: context.clone(),
                    conversation,
                    client,
                    claimed: false,
                },
            );
        drop(owners);
        current.check()?;
        Ok(prepared)
    }
    pub fn processor(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> io::Result<Box<dyn SessionProcessor>> {
        let lease = self.current(host, &context.window)?;
        let target: Uuid = binding.target_id.parse().map_err(|_| denied())?;
        let conversation = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get(&context.window)
                .filter(|owner| {
                    owner.generation == binding.admission
                        && owner.session == lease.session()
                        && !owner.rebindable
                })
                .ok_or_else(denied)?;
            owner
                .captures
                .values()
                .find(|plan| {
                    plan.prepared.target_id == target
                        && plan.context.window == context.window
                        && plan.context.url == context.url
                        && (plan.client.is_none() || plan.claimed)
                })
                .map(|plan| plan.conversation.clone())
        };
        let Some(conversation) = conversation else {
            return self.canonical_processor(host, context, binding);
        };
        let permit = Arc::new(self.register_processing(host, context, binding)?);
        let call = permit.call();
        // The admitted Codex profile forwards no credential values. Other
        // launch profiles must supply their own exact native secret seeds.
        let privacy = self
            .privacy
            .get()
            .ok_or_else(denied)?
            .for_workspace(&call.workspace_root()?, &[])?;
        let retained = permit.clone();
        let inner = conversation.processor(
            call,
            Binding {
                scope: conversation.scope(),
                worker: binding.session_id.clone(),
                request: binding.request_id.clone(),
                target: binding.target_id.clone(),
                window: context.window.clone(),
                admission: binding.admission.clone(),
            },
            privacy.sanitizer.clone(),
            Arc::new(move || retained.check().map_err(|_| CaptureError::Rejected)),
        )?;
        permit.check()?;
        Ok(Box::new(WorkerProcessor::new(Box::new(OwnedCapture {
            inner,
            permit,
            privacy,
            worker: binding.session_id.clone(),
            conversation: conversation.request_id(),
        }))))
    }
}
