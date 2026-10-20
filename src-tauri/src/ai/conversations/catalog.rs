//! Current committed ThreadStore discovery, independent of private write intents.
use super::{identity::Identity, invalid, provider, read, unknown};
use crate::ai::backend::BackendCall;
use jj_collab::{
    CollabGraphV1, CollabObjectV1, ThreadId, ThreadPurposeV1, ThreadStateV1, ThreadStatusV1,
    ThreadVersionV1,
};
use jj_store_model::RepositoryId;
use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, io, sync::Arc};

const PAGE: usize = 32;
const THREADS: usize = 4096;
const HEADERS: usize = 8192;
#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Cursor {
    version: u8,
    selection: Vec<u8>,
    after: ThreadId,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Summary {
    #[serde(flatten)]
    identity: Identity,
    title: String,
    status: ThreadStatusV1,
    created_at_millis: i64,
    updated_at_millis: i64,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Page {
    version: u8,
    repository: Option<RepositoryId>,
    selection: Vec<u8>,
    conversations: Vec<Summary>,
    next_cursor: Option<String>,
}
fn limit() -> io::Error {
    io::Error::other("Conversation catalog limit exceeded")
}
fn creation<'a>(
    graph: &'a CollabGraphV1,
    header: &'a ThreadVersionV1,
    budget: &mut usize,
) -> io::Result<i64> {
    let mut current = header;
    while let Some(previous) = current.previous {
        *budget = budget.checked_sub(1).ok_or_else(limit)?;
        let CollabObjectV1::ThreadVersion(parent) = graph.get(previous).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if parent.thread_id != header.thread_id {
            return Err(invalid());
        }
        current = parent;
    }
    Ok(current.accepted_at_millis)
}
pub async fn list(call: BackendCall, cursor: Option<String>) -> io::Result<String> {
    let after = cursor
        .map(|text| {
            if text.len() > 2048 {
                return Err(invalid());
            }
            let cursor: Cursor = serde_json::from_str(&text).map_err(|_| invalid())?;
            if cursor.version != 1 || cursor.selection.len() > 256 {
                return Err(invalid());
            }
            Ok(cursor)
        })
        .transpose()?;
    let call = Arc::new(call);
    let _guard = call.preparation_guard().await?;
    let stores = provider::read_current(call.clone())?;
    let snapshot = stores
        .thread()
        .ok_or_else(invalid)?
        .snapshot()
        .await
        .map_err(|_| unknown())?;
    if snapshot.selection.len() > 256 {
        return Err(limit());
    }
    if after
        .as_ref()
        .is_some_and(|c| c.selection != snapshot.selection)
    {
        return Err(io::Error::other(
            "Conversation catalog source changed; restart discovery",
        ));
    }
    let data = &snapshot.data;
    let state = ThreadStateV1::read(data.root.clone(), &data.graph).map_err(|_| invalid())?;
    if state.threads.len() > THREADS {
        return Err(limit());
    }
    let mut targets = BTreeSet::new();
    let mut headers = Vec::new();
    for (id, reference) in &state.threads {
        let CollabObjectV1::ThreadVersion(header) =
            data.graph.get(*reference).map_err(|_| invalid())?
        else {
            return Err(invalid());
        };
        if header.thread_id != *id {
            return Err(invalid());
        }
        if let Some(ThreadPurposeV1::Conversation { target }) = &header.purpose {
            if header.status == ThreadStatusV1::Tombstoned {
                continue;
            }
            if !targets.insert(target.key().map_err(|_| invalid())?) {
                return Err(invalid());
            }
            headers.push((target, header.as_ref()));
        }
    }
    let start = match after {
        None => 0,
        Some(cursor) => {
            headers
                .iter()
                .position(|(_, h)| h.thread_id == cursor.after)
                .ok_or_else(invalid)?
                + 1
        }
    };
    let mut conversations = Vec::new();
    let mut budget = HEADERS;
    for (target, header) in headers.iter().skip(start).take(PAGE) {
        let title: &str = match state.metadata.get(&target.key().map_err(|_| invalid())?) {
            None => &header.title,
            Some(reference) => {
                let CollabObjectV1::ConversationMetadata(metadata) =
                    data.graph.get(*reference).map_err(|_| invalid())?
                else {
                    return Err(invalid());
                };
                if metadata.thread_id != header.thread_id || &metadata.target != *target {
                    return Err(invalid());
                }
                metadata.value.title().unwrap_or(&header.title)
            }
        };
        conversations.push(Summary {
            identity: Identity {
                target: (*target).clone(),
                thread_id: header.thread_id,
                repository: snapshot.scope.repository,
            },
            title: title.into(),
            status: header.status,
            created_at_millis: creation(&data.graph, header, &mut budget)?,
            updated_at_millis: header.accepted_at_millis,
        });
    }
    let next_cursor = if start + conversations.len() < headers.len() {
        Some(
            serde_json::to_string(&Cursor {
                version: 1,
                selection: snapshot.selection.clone(),
                after: conversations.last().ok_or_else(invalid)?.identity.thread_id,
            })
            .map_err(|_| invalid())?,
        )
    } else {
        None
    };
    call.check()?;
    let encoded = read::encode(&Page {
        version: 1,
        repository: snapshot.scope.repository,
        selection: snapshot.selection,
        conversations,
        next_cursor,
    })?;
    call.check()?;
    Ok(encoded)
}
