use super::{NativeBackends, denied, managed::Client};
use crate::host::state::NativeHost;
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use lapis_desktop::ai::{
    capture::WorkerProcessor,
    conversations::{CanonicalIdentity, PreparedCanonicalConversation},
};
use serde::Serialize;
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::{HostContext, SessionBinding, runtime::SessionProcessor};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Prepared {
    pub request_id: RequestId,
    pub conversation: CanonicalIdentity,
    pub target_id: Uuid,
}
pub(super) struct Plan {
    pub prepared: Prepared,
    pub context: HostContext,
    pub conversation: Arc<PreparedCanonicalConversation>,
    pub client: Client,
    pub claimed: bool,
    pub participant: Option<lapis_desktop::ai::conversations::capture_facts::Participant>,
    pub dispatch: Option<lapis_desktop::ai::conversations::dispatch::Hook>,
}
pub(super) struct Preparation {
    pub request: RequestId,
    pub thread: ThreadId,
    pub observed: Vec<u8>,
    pub client: Client,
    pub participant: Option<lapis_desktop::ai::conversations::capture_facts::Participant>,
    pub dispatch_request_id: Option<RequestId>,
}
impl NativeBackends {
    /// The command worker retains transitions until preparation is complete.
    pub(super) fn prepare_canonical_capture(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        handle: Uuid,
        input: Preparation,
    ) -> io::Result<Prepared> {
        if let Some(participant) = &input.participant {
            participant.validate()?;
        }
        let call = self.conversation_call(host, context, session, handle)?;
        if input.dispatch_request_id.is_none() {
            lapis_desktop::ai::conversations::dispatch::ensure_unclaimed(&call, input.request)?;
        }
        let (prior, room_for_plan) = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners.get(&context.window).ok_or_else(denied)?;
            if owner.captures.contains_key(&input.request) {
                return Err(denied());
            }
            let prior = if let Some(prior) = owner.canonical_captures.get(&input.request) {
                if prior.prepared.conversation.thread_id != input.thread
                    || prior.conversation.observed() != input.observed.as_slice()
                    || prior.client != input.client
                    || prior.participant != input.participant
                    || prior.dispatch.as_ref().map(|hook| hook.parent_request())
                        != input.dispatch_request_id
                    || prior
                        .dispatch
                        .as_ref()
                        .is_some_and(|hook| hook.owner_handle() != handle)
                    || prior.context.url != context.url
                {
                    return Err(denied());
                }
                Some((prior.prepared.clone(), prior.conversation.clone()))
            } else {
                None
            };
            (
                prior,
                owner.captures.len() + owner.canonical_captures.len() < 64,
            )
        };
        if let Some((prepared, conversation)) = prior {
            conversation.check(&call)?;
            return Ok(prepared);
        }
        let current = Arc::new(self.conversation_call(host, context, session, handle)?);
        let reservation = input
            .dispatch_request_id
            .map(|parent| {
                tauri::async_runtime::block_on(lapis_desktop::ai::conversations::dispatch::reserve(
                    current.clone(),
                    self.dispatch_owner(context, handle)?,
                    parent,
                    input.thread,
                    &input.observed,
                    lapis_desktop::ai::conversations::dispatch::RecipientInput {
                        request_id: input.request,
                        participant: input.participant.clone(),
                    },
                    room_for_plan,
                ))
            })
            .transpose()?;
        if let Some(reservation) = &reservation
            && !reservation.fresh
        {
            return Ok(Prepared {
                request_id: input.request,
                conversation: reservation.hook.identity().clone(),
                target_id: reservation.target,
            });
        }
        if !room_for_plan {
            return Err(super::busy());
        }
        let conversation = Arc::new(tauri::async_runtime::block_on(
            PreparedCanonicalConversation::load(call, input.thread, input.observed.clone()),
        )?);
        let prepared = Prepared {
            request_id: input.request,
            conversation: conversation.identity().clone(),
            target_id: reservation
                .as_ref()
                .map(|r| r.target)
                .unwrap_or_else(Uuid::new_v4),
        };
        self.owners
            .lock()
            .map_err(|_| denied())?
            .get_mut(&context.window)
            .filter(|owner| owner.opened.handle == handle)
            .ok_or_else(denied)?
            .canonical_captures
            .insert(
                input.request,
                Plan {
                    prepared: prepared.clone(),
                    context: context.clone(),
                    conversation,
                    client: input.client,
                    participant: input.participant,
                    claimed: false,
                    dispatch: reservation.map(|r| r.hook),
                },
            );
        current.check()?;
        Ok(prepared)
    }
    pub(super) fn claim_canonical_launch(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        target: Uuid,
    ) -> io::Result<()> {
        let lease = self.current(host, &context.window)?;
        let (handle, conversation) = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get(&context.window)
                .filter(|owner| {
                    owner.generation == lease.generation()
                        && owner.session == lease.session()
                        && !owner.rebindable
                })
                .ok_or_else(denied)?;
            let plan = owner
                .canonical_captures
                .values()
                .find(|plan| {
                    plan.prepared.target_id == target
                        && plan.context.window == context.window
                        && plan.context.url == context.url
                        && plan.client == Client::Codex
                        && !plan.claimed
                        && plan
                            .dispatch
                            .as_ref()
                            .is_none_or(|hook| hook.owner_handle() == owner.opened.handle)
                })
                .ok_or_else(denied)?;
            (owner.opened.handle, plan.conversation.clone())
        };
        let call = self.conversation_call(host, context, lease.session(), handle)?;
        conversation.check(&call)?;
        {
            let mut owners = self.owners.lock().map_err(|_| denied())?;
            let plan = owners
                .get_mut(&context.window)
                .filter(|owner| owner.opened.handle == handle && !owner.rebindable)
                .and_then(|owner| {
                    owner.canonical_captures.values_mut().find(|plan| {
                        plan.prepared.target_id == target
                            && Arc::ptr_eq(&plan.conversation, &conversation)
                            && plan.client == Client::Codex
                            && !plan.claimed
                            && plan
                                .dispatch
                                .as_ref()
                                .is_none_or(|hook| hook.owner_handle() == handle)
                    })
                })
                .ok_or_else(denied)?;
            plan.claimed = true;
        }
        call.check()
    }
    pub(super) fn canonical_processor(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> io::Result<Box<dyn SessionProcessor>> {
        let target: Uuid = binding.target_id.parse().map_err(|_| denied())?;
        let lease = self.current(host, &context.window)?;
        let (conversation, participant, dispatch) = {
            let mut owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get_mut(&context.window)
                .filter(|owner| {
                    owner.generation == binding.admission
                        && owner.session == lease.session()
                        && !owner.rebindable
                })
                .ok_or_else(denied)?;
            let request = owner
                .canonical_captures
                .iter()
                .find(|(_, plan)| {
                    plan.prepared.target_id == target
                        && plan.context.window == context.window
                        && plan.context.url == context.url
                        && plan.claimed
                        && plan
                            .dispatch
                            .as_ref()
                            .is_none_or(|hook| hook.owner_handle() == owner.opened.handle)
                })
                .map(|(request, _)| *request)
                .ok_or_else(denied)?;
            let plan = owner.canonical_captures.get(&request).ok_or_else(denied)?;
            if plan.dispatch.is_some() {
                // The native processor takes one ownership transfer. Durable
                // claims retain the spent target after this volatile slot ends.
                let plan = owner
                    .canonical_captures
                    .remove(&request)
                    .ok_or_else(denied)?;
                (plan.conversation, plan.participant, plan.dispatch)
            } else {
                (plan.conversation.clone(), plan.participant.clone(), None)
            }
        };
        let permit = Arc::new(self.register_processing(host, context, binding)?);
        conversation.check(&permit.call())?;
        let processor = super::canonical_capture_owner::CanonicalCapture::new(
            self.clone(),
            permit,
            conversation,
            participant,
            dispatch,
            context,
            binding,
        )?;
        Ok(Box::new(WorkerProcessor::new(Box::new(processor))))
    }
}
