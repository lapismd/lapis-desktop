//! Typed human authorship; never a serialized renderer transcript or provider replay.
mod intent;
use super::{invalid, read, unknown};
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
use cap_std::fs::Dir;
use intent::Intent;
use jj_collab::{HumanMessageId, ThreadStateV1};
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_core::{RepositoryStores, StoreOutcome, StoreRequest};
use jj_store_model::RequestId;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{io, sync::Arc};

const DIRECTORY: &str = "conversation-messages-v1";
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageWrite {
    request_id: RequestId,
    conversation_request_id: RequestId,
    message_id: HumanMessageId,
    receipt: Option<String>,
}
async fn recover(
    call: &BackendCall,
    stores: &RepositoryStores,
    directory: &Dir,
    intent: &mut Intent,
) -> io::Result<MessageWrite> {
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .status(intent.request.request_id)
        .await;
    call.check()?;
    match outcome {
        Ok(StoreOutcome::Committed(receipt)) => {
            intent.confirm(receipt)?;
            intent.save(directory, false).map_err(|_| unknown())?;
        }
        _ if intent.receipt.is_some() => return Err(unknown()),
        _ => {}
    }
    call.check()?;
    intent.reply()
}
pub async fn append(
    call: BackendCall,
    conversation: RequestId,
    request: RequestId,
    text: String,
    privacy: Arc<TranscriptSanitizer>,
) -> io::Result<MessageWrite> {
    if text.trim().is_empty() || text.len() > 256 * 1024 || text.contains('\0') {
        return Err(invalid());
    }
    let mut digest = Sha256::new();
    digest.update(b"lapis-native-authored-message-v1\0");
    digest.update(text.as_bytes());
    let fingerprint: [u8; 32] = digest.finalize().into();
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (original, stores) = read::confirmed(&call, conversation)
        .await?
        .ok_or_else(invalid)?;
    let (profile, _, _) = call.conversation_location()?;
    if let Some(directory) = storage::existing_directory(&profile, DIRECTORY)?
        && let Some(mut retained) = Intent::read(&directory, request)?
    {
        retained.validate(&call, &original, request)?;
        if retained.fingerprint != fingerprint {
            return Err(invalid());
        }
        return recover(&call, &stores, &directory, &mut retained).await;
    }
    let safe = privacy
        .sanitize(serde_json::json!({"text":text}))
        .ok_or_else(invalid)?;
    let safe: serde_json::Value = serde_json::from_slice(safe.bytes()).map_err(|_| invalid())?;
    let body = safe["text"].as_str().ok_or_else(invalid)?.to_owned();
    let snapshot = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    let state =
        ThreadStateV1::read(snapshot.data.root, &snapshot.data.graph).map_err(|_| invalid())?;
    let expected = *state
        .threads
        .get(&original.command()?.thread_id())
        .ok_or_else(invalid)?;
    let mut intent = Intent::new(&call, &original, request, expected, body, fingerprint)?;
    call.check()?;
    let directory = storage::directory(&profile, DIRECTORY)?;
    intent.save(&directory, true).map_err(|_| unknown())?;
    call.check()?;
    let jj_store_git::repository::LocalCollabCommand::Thread { intent: command } =
        &intent.request.command
    else {
        return Err(invalid());
    };
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .execute(&StoreRequest::new(request, command.clone()))
        .await;
    call.check()?;
    if let Ok(StoreOutcome::Committed(receipt)) = outcome {
        intent.confirm(receipt)?;
        intent.save(&directory, false).map_err(|_| unknown())?;
    }
    call.check()?;
    intent.reply()
}
pub async fn status(
    call: BackendCall,
    conversation: RequestId,
    request: RequestId,
) -> io::Result<Option<MessageWrite>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (original, stores) = read::confirmed(&call, conversation)
        .await?
        .ok_or_else(invalid)?;
    let (profile, _, _) = call.conversation_location()?;
    let Some(directory) = storage::existing_directory(&profile, DIRECTORY)? else {
        call.check()?;
        return Ok(None);
    };
    let Some(mut intent) = Intent::read(&directory, request)? else {
        call.check()?;
        return Ok(None);
    };
    intent.validate(&call, &original, request)?;
    recover(&call, &stores, &directory, &mut intent)
        .await
        .map(Some)
}
