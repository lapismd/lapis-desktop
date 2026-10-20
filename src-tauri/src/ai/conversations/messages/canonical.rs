//! Authorship by canonical membership; no private creation record is required.
use super::{
    super::{identity::Identity, invalid, member, provider, records, unknown},
    canonical_intent::{DIRECTORY, Intent},
};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use cap_std::fs::Dir;
use jj_collab::{HumanMessageId, ThreadId};
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{io, sync::Arc};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Input {
    pub request_id: RequestId,
    pub thread_id: ThreadId,
    pub expected_selection: Vec<u8>,
    pub text: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageWrite {
    pub request_id: RequestId,
    pub(in crate::ai::conversations) conversation: Identity,
    pub message_id: HumanMessageId,
    pub receipt: Option<String>,
    #[serde(skip)]
    pub(super) proof: Option<jj_store_git::repository::LocalCollabReceipt>,
}
impl MessageWrite {
    pub(in crate::ai::conversations) fn authored_turn(
        &self,
    ) -> io::Result<super::super::capture_facts::AuthoredTurn> {
        let proof = self.proof.as_ref().ok_or_else(unknown)?;
        let jj_collab::CollabCommandResultV1::Thread { result } = &proof.result else {
            return Err(invalid());
        };
        Ok(super::super::capture_facts::AuthoredTurn {
            request_id: self.request_id,
            message_id: self.message_id,
            revision: result.message.ok_or_else(invalid)?,
            thread_version: result.version,
            actor: proof.actor,
        })
    }
    pub fn is_confirmed(&self) -> bool {
        self.receipt.is_some()
    }
}
async fn recover(
    call: Arc<BackendCall>,
    dir: &Dir,
    intent: &mut Intent,
) -> io::Result<MessageWrite> {
    let current = member::current(call.clone(), intent.identity.thread_id, None, false).await?;
    if current.identity != intent.identity {
        return Err(invalid());
    }
    let stores = provider::write_current(
        call.clone(),
        intent.actor,
        intent.identity.repository.ok_or_else(invalid)?,
    )?;
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .status(intent.request.request_id)
        .await;
    call.check()?;
    match outcome {
        Ok(StoreOutcome::Committed(receipt)) => {
            intent.confirm(receipt)?;
            intent.save(dir, false).map_err(|_| unknown())?;
        }
        _ if intent.receipt.is_some() => return Err(unknown()),
        _ => {}
    }
    call.check()?;
    intent.reply()
}
pub async fn append(
    call: BackendCall,
    input: Input,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<MessageWrite> {
    append_inner(Arc::new(call), input, None, privacy).await
}
/// Native worker only: retain an existing request's original observed selection.
/// New requests resolve current membership; renderer append stays selection-bound.
pub(in crate::ai::conversations) async fn append_managed(
    call: Arc<BackendCall>,
    identity: &Identity,
    request: RequestId,
    text: String,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<MessageWrite> {
    append_inner(
        call,
        Input {
            request_id: request,
            thread_id: identity.thread_id,
            expected_selection: Vec::new(),
            text,
        },
        Some(identity),
        privacy,
    )
    .await
}
async fn append_inner(
    call: Arc<BackendCall>,
    input: Input,
    expected_identity: Option<&Identity>,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<MessageWrite> {
    if input.text.trim().is_empty()
        || input.text.len() > 256 * 1024
        || input.text.contains('\0')
        || expected_identity.is_none() && input.expected_selection.is_empty()
        || input.expected_selection.len() > 256
    {
        return Err(invalid());
    }
    let fingerprint: [u8; 32] =
        Sha256::new_with_prefix(b"lapis-canonical-authored-message-input-v1\0")
            .chain_update(input.text.as_bytes())
            .finalize()
            .into();
    let _guard = call.preparation_guard().await?;
    if let Some(identity) = expected_identity {
        let current = member::current(call.clone(), input.thread_id, None, true).await?;
        if current.identity != *identity {
            return Err(invalid());
        }
    }
    let (profile, _, _) = call.conversation_location()?;
    if let Some(dir) = storage::existing_directory(&profile, DIRECTORY)?
        && let Some(mut intent) = Intent::read(&dir, input.request_id)?
    {
        intent.validate(&call, input.request_id, input.thread_id)?;
        if intent.fingerprint != fingerprint
            || expected_identity.is_none() && intent.observed != input.expected_selection
            || expected_identity.is_some_and(|identity| *identity != intent.identity)
        {
            return Err(invalid());
        }
        return recover(call.clone(), &dir, &mut intent).await;
    }
    let current = member::current(
        call.clone(),
        input.thread_id,
        expected_identity
            .is_none()
            .then_some(input.expected_selection.as_slice()),
        true,
    )
    .await?;
    if expected_identity.is_some_and(|identity| *identity != current.identity) {
        return Err(invalid());
    }
    let safe = privacy
        .sanitize(serde_json::json!({"text":input.text}))
        .ok_or_else(invalid)?;
    let safe: serde_json::Value = serde_json::from_slice(safe.bytes()).map_err(|_| invalid())?;
    let body = safe["text"].as_str().ok_or_else(invalid)?.to_owned();
    call.check()?;
    let actor_dir = storage::directory(&profile, "conversations-v1")?;
    let actor = records::actor(&actor_dir, true)?.ok_or_else(invalid)?;
    let mut intent = Intent::new(&call, current, actor, input.request_id, body, fingerprint)?;
    let dir = storage::directory(&profile, DIRECTORY)?;
    intent.save(&dir, true).map_err(|_| unknown())?;
    call.check()?;
    let stores = provider::write_current(
        call.clone(),
        actor,
        intent.identity.repository.ok_or_else(invalid)?,
    )?;
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .execute(&StoreRequest::new(
            intent.request.request_id,
            intent.command()?.clone(),
        ))
        .await;
    call.check()?;
    if let Ok(StoreOutcome::Committed(receipt)) = outcome {
        intent.confirm(receipt)?;
        intent.save(&dir, false).map_err(|_| unknown())?;
    }
    call.check()?;
    intent.reply()
}
pub async fn status(
    call: BackendCall,
    request: RequestId,
    thread: ThreadId,
) -> io::Result<Option<MessageWrite>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    status_locked(call, request, thread).await
}
/// Caller retains this same backend's preparation guard; avoids recursive locking.
pub(in crate::ai::conversations) async fn status_locked(
    call: Arc<BackendCall>,
    request: RequestId,
    thread: ThreadId,
) -> io::Result<Option<MessageWrite>> {
    let (profile, _, _) = call.conversation_location()?;
    let Some(dir) = storage::existing_directory(&profile, DIRECTORY)? else {
        call.check()?;
        return Ok(None);
    };
    let Some(mut intent) = Intent::read(&dir, request)? else {
        call.check()?;
        return Ok(None);
    };
    intent.validate(&call, request, thread)?;
    recover(call.clone(), &dir, &mut intent).await.map(Some)
}
