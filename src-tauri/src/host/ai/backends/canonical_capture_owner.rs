//! Only WorkerProcessor may poll this processor's storage/privacy futures.
use super::{NativeBackends, privacy, processing::CapturePermit};
use jj_store_conversations::capture::{Binding, CaptureError};
use jj_store_model::RequestId;
use lapis_desktop::ai::conversations::capture_facts::{
    AuthoredTurn, FIELD, HostFacts, Participant,
};
use lapis_desktop::ai::conversations::dispatch;
use lapis_desktop::ai::{capture::ManagedCapture, conversations::PreparedCanonicalConversation};
use std::{collections::BTreeMap, io, sync::Arc};
use tauri_plugin_lapis_ai::{
    HostContext, SessionBinding,
    runtime::{
        BatchProcessorFuture, Error, FrameInput, RequestInput, RequestProcessorFuture,
        SessionProcessor, SessionRequest,
    },
};
use uuid::Uuid;

pub(super) struct CanonicalCapture {
    backends: Arc<NativeBackends>,
    permit: Arc<CapturePermit>,
    conversation: Arc<PreparedCanonicalConversation>,
    binding: Binding,
    privacy: Option<privacy::Privacy>,
    inner: Option<ManagedCapture>,
    participant: Option<Participant>,
    authored: BTreeMap<String, AuthoredTurn>,
    dispatch: Option<dispatch::Hook>,
    dispatch_binding: dispatch::Binding,
}
impl CanonicalCapture {
    pub fn new(
        backends: Arc<NativeBackends>,
        permit: Arc<CapturePermit>,
        conversation: Arc<PreparedCanonicalConversation>,
        participant: Option<Participant>,
        dispatch: Option<dispatch::Hook>,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> io::Result<Self> {
        let scope = conversation.scope()?;
        Ok(Self {
            backends,
            permit,
            conversation,
            binding: Binding {
                scope,
                worker: binding.session_id.clone(),
                request: binding.request_id.clone(),
                target: binding.target_id.clone(),
                window: context.window.clone(),
                admission: binding.admission.clone(),
            },
            privacy: None,
            inner: None,
            participant,
            authored: BTreeMap::new(),
            dispatch,
            dispatch_binding: dispatch::Binding {
                worker: binding.session_id.clone(),
                open_request: binding.request_id.clone(),
                target: Uuid::parse_str(&binding.target_id).map_err(|_| super::denied())?,
            },
        })
    }
    async fn initialize(&mut self) -> Result<(), Error> {
        self.permit
            .check()
            .map_err(|_| Error("capture_scope_unavailable"))?;
        if self.inner.is_none() {
            let call = self.permit.call();
            self.conversation
                .current(call.clone(), true)
                .await
                .map_err(|_| Error("canonical_capture_unavailable"))?;
            // The closed Codex profile forwards no native credential values.
            let privacy = self
                .backends
                .privacy
                .get()
                .ok_or(Error("capture_privacy_unavailable"))?
                .for_workspace(
                    &call
                        .workspace_root()
                        .map_err(|_| Error("capture_scope_unavailable"))?,
                    &[],
                )
                .map_err(|_| Error("capture_privacy_unavailable"))?;
            let retained = self.permit.clone();
            if let Some(dispatch) = &self.dispatch {
                dispatch
                    .bind(call.clone(), self.dispatch_binding.clone())
                    .await
                    .map_err(|_| Error("dispatch_binding_unavailable"))?;
            }
            let inner = self
                .conversation
                .processor(
                    call,
                    self.binding.clone(),
                    privacy.sanitizer.clone(),
                    Arc::new(move || retained.check().map_err(|_| CaptureError::Rejected)),
                )
                .await
                .map_err(|_| Error("canonical_capture_unavailable"))?;
            self.privacy = Some(privacy);
            self.inner = Some(inner);
        }
        Ok(())
    }
}
impl SessionProcessor for CanonicalCapture {
    fn prepare_request<'a>(&'a mut self, input: RequestInput<'a>) -> RequestProcessorFuture<'a> {
        Box::pin(async move {
            if input.session_id != self.binding.worker {
                return Err(Error("capture_scope_unavailable"));
            }
            self.initialize().await?;
            let SessionRequest::Prompt {
                text,
                context,
                max_duration_ms,
            } = input.request
            else {
                return self
                    .permit
                    .check()
                    .map_err(|_| Error("capture_scope_unavailable"));
            };
            let request = Uuid::parse_str(input.request_id)
                .ok()
                .filter(|id| id.to_string() == input.request_id)
                .ok_or(Error("invalid_authored_request_identity"))?;
            let request_id = RequestId::new(*request.as_bytes());
            if let Some(dispatch) = &self.dispatch {
                dispatch
                    .authorize_prompt(
                        self.permit.call(),
                        &self.dispatch_binding,
                        request_id,
                        !text.trim().is_empty(),
                    )
                    .await
                    .map_err(|_| Error("dispatch_prompt_not_admitted"))?;
            }
            self.conversation
                .current(self.permit.call(), true)
                .await
                .map_err(|_| Error("canonical_capture_unavailable"))?;
            if !text.trim().is_empty() {
                if !self.authored.contains_key(input.request_id) && self.authored.len() >= 256 {
                    return Err(Error("canonical_prompt_inventory_limit"));
                }
                let authored = self
                    .conversation
                    .append(
                        self.permit.call(),
                        request_id,
                        text.clone(),
                        self.privacy
                            .as_ref()
                            .ok_or(Error("capture_privacy_unavailable"))?
                            .sanitizer
                            .clone(),
                    )
                    .await
                    .map_err(|_| Error("authored_message_preparation_failed"))?;
                if self
                    .authored
                    .get(input.request_id)
                    .is_some_and(|prior| *prior != authored)
                {
                    return Err(Error("authored_message_preparation_failed"));
                }
                self.authored.insert(input.request_id.into(), authored);
            }
            if let Some(dispatch) = &self.dispatch {
                dispatch
                    .prepare_prompt(
                        self.permit.call(),
                        &self.dispatch_binding,
                        request_id,
                        (text, context.as_deref(), *max_duration_ms),
                        self.authored.get(input.request_id),
                        self.privacy
                            .as_ref()
                            .ok_or(Error("capture_privacy_unavailable"))?
                            .sanitizer
                            .clone(),
                    )
                    .await
                    .map_err(|_| Error("dispatch_preparation_unavailable"))?;
            }
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))
        })
    }
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        Box::pin(async move {
            if input.session_id != self.binding.worker {
                return Err(Error("capture_scope_unavailable"));
            }
            self.initialize().await?;
            self.conversation
                .current(self.permit.call(), false)
                .await
                .map_err(|_| Error("canonical_capture_unavailable"))?;
            let request_id = input
                .frame
                .get("requestId")
                .and_then(|v| v.as_str())
                .map(String::from);
            let facts = HostFacts {
                schema: 1,
                repository: self
                    .conversation
                    .identity()
                    .repository
                    .ok_or(Error("canonical_capture_unavailable"))?,
                thread_id: self.conversation.identity().thread_id,
                worker: self.binding.worker.clone(),
                client_id: "codex".into(),
                participant: self.participant.clone(),
                authored: request_id
                    .as_ref()
                    .and_then(|id| self.authored.get(id))
                    .cloned(),
                request_id,
            };
            facts
                .validate()
                .map_err(|_| Error("canonical_capture_facts_invalid"))?;
            let mut frame = input.frame.clone();
            // Preserve a colliding provider extension as inert evidence, separate
            // from native attribution. Both values pass through native privacy.
            let object = frame
                .as_object_mut()
                .ok_or(Error("canonical_capture_facts_invalid"))?;
            let mut extension = serde_json::Map::new();
            extension.insert(
                "host".into(),
                serde_json::to_value(facts)
                    .map_err(|_| Error("canonical_capture_facts_invalid"))?,
            );
            if let Some(provider) = object.remove(FIELD) {
                extension.insert("provider".into(), provider);
            }
            object.insert(FIELD.into(), extension.into());
            let original = input.frame;
            let output = self
                .inner
                .as_mut()
                .ok_or(Error("canonical_capture_unavailable"))?
                .process_batch(FrameInput {
                    frame: &frame,
                    ..input
                })
                .await?;
            if let Some(dispatch) = &self.dispatch {
                dispatch
                    .observe(self.permit.call(), &self.dispatch_binding, original)
                    .await
                    .map_err(|_| Error("dispatch_observation_unavailable"))?;
            }
            self.permit
                .check()
                .map_err(|_| Error("capture_scope_unavailable"))?;
            Ok(output)
        })
    }
}
