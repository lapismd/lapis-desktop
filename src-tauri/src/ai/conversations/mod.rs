//! Native-owned conversation preparation; recovery only reads original receipts.
mod canonical_capture;
mod capture;
pub mod capture_facts;
mod capture_sink;
mod capture_stores;
pub mod catalog;
pub mod dispatch;
pub mod edits;
mod identity;
mod member;
pub mod messages;
mod provider;
mod read;
mod records;
use crate::{ai::backend::BackendCall, vault::private_profile as storage};
pub use canonical_capture::PreparedCanonicalConversation;
use cap_std::fs::Dir;
pub use capture::PreparedConversation;
pub use identity::Identity as CanonicalIdentity;
use jj_collab::ThreadId;
use jj_store_core::{StoreOutcome, StoreRequest};
use jj_store_model::{RepositoryId, RequestId};
pub use read::canonical::{open as open_canonical, read as read_canonical};
pub use read::{ReadPin, open as open_read, read};
use records::Record;
use serde::Serialize;
use std::{io, sync::Arc};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub request_id: RequestId,
    pub conversation_id: Uuid,
    pub thread_id: ThreadId,
    pub repository: Option<RepositoryId>,
    /// Canonical text preserves full-width native integers across renderer JSON.
    pub receipt: Option<String>,
}
fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidData,
        "Conversation preparation conflicts with its original intent",
    )
}
fn unknown() -> io::Error {
    io::Error::other("Conversation preparation outcome is unknown; read its original status")
}
fn reply(record: &Record) -> io::Result<Conversation> {
    Ok(Conversation {
        request_id: record.request.request_id,
        conversation_id: record.conversation,
        thread_id: record.command()?.thread_id(),
        repository: record
            .receipt
            .as_ref()
            .map(|r| r.repository)
            .or(record.repository),
        receipt: record
            .receipt
            .as_ref()
            .map(serde_json::to_string)
            .transpose()
            .map_err(|_| invalid())?,
    })
}
async fn recover(
    call: Arc<BackendCall>,
    root: &std::path::Path,
    dir: &Dir,
    record: &mut Record,
) -> io::Result<Conversation> {
    let stores = provider::open(call.clone(), root, record)?;
    let outcome = stores
        .thread()
        .ok_or_else(invalid)?
        .status(record.request.request_id)
        .await;
    call.check()?;
    match outcome {
        Ok(StoreOutcome::Committed(receipt)) => {
            provider::confirm(record, receipt)?;
            record.save(dir, false).map_err(|_| unknown())?;
        }
        _ if record.receipt.is_some() => return Err(unknown()),
        _ => {}
    }
    call.check()?;
    reply(record)
}
/// Explicit write. Repeated requests recover status and never execute again.
pub async fn prepare(
    call: BackendCall,
    request: RequestId,
    title: String,
) -> io::Result<Conversation> {
    if title.trim().is_empty() || title.len() > 1024 || title.chars().any(char::is_control) {
        return Err(invalid());
    }
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (profile, root, source) = call.conversation_location()?;
    let dir = storage::directory(&profile, "conversations-v1")?;
    if let Some(mut record) = records::read(&dir, request)? {
        let actor = records::actor(&dir, false)?.ok_or_else(invalid)?;
        record.validate(request, source, call.selection(), actor)?;
        if record.title()? != title {
            return Err(invalid());
        }
        return recover(call, &root, &dir, &mut record).await;
    }
    let actor = records::actor(&dir, true)?.ok_or_else(invalid)?;
    let repository = provider::repository(&call)?;
    let mut record = Record::new(
        source,
        call.selection().clone(),
        actor,
        repository,
        request,
        title,
    )?;
    call.check()?;
    // The original generated identities and exact command survive every outcome.
    record.save(&dir, true).map_err(|_| unknown())?;
    call.check()?;
    let stores = provider::open(call.clone(), &root, &record)?;
    let command = StoreRequest::new(request, record.command()?.clone());
    let outcome = stores.thread().ok_or_else(invalid)?.execute(&command).await;
    call.check()?;
    if let Ok(StoreOutcome::Committed(receipt)) = outcome {
        provider::confirm(&mut record, receipt)?;
        record.save(&dir, false).map_err(|_| unknown())?;
    }
    call.check()?;
    reply(&record)
}
/// Read-only recovery; absence is unknown and does not establish a new intent.
pub async fn status(call: BackendCall, request: RequestId) -> io::Result<Option<Conversation>> {
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let (profile, root, source) = call.conversation_location()?;
    let Some(dir) = storage::existing_directory(&profile, "conversations-v1")? else {
        call.check()?;
        return Ok(None);
    };
    let Some(mut record) = records::read(&dir, request)? else {
        call.check()?;
        return Ok(None);
    };
    let actor = records::actor(&dir, false)?.ok_or_else(invalid)?;
    record.validate(request, source, call.selection(), actor)?;
    recover(call, &root, &dir, &mut record).await.map(Some)
}
