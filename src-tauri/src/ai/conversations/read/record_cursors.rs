//! Only references reached from the originally linked native session are readable.
use super::{encode, invalid, record_values::RecordValue, retained::ReadContext};
use crate::ai::backend::BackendCall;
use jj_agent::{AgentObjectRef, AgentSessionId, AgentSessionSnapshotV1};
use jj_store_core::engine::AgentSnapshotRead;
use serde::Serialize;
use std::{
    collections::{BTreeMap, BTreeSet},
    io,
    sync::atomic::{AtomicUsize, Ordering},
};
use tokio::sync::Mutex;
use uuid::Uuid;

const MAX_REFERENCES: usize = 65_536;
const PAGE_OBJECTS: usize = 16;
const PAGE_BYTES: usize = 1536 * 1024;

#[derive(Default)]
pub(super) struct RecordReads {
    cursors: BTreeMap<Uuid, RecordCursor>,
    references: AtomicUsize,
}
struct RecordCursor {
    session: AgentSessionId,
    progress: Mutex<Progress>,
}
struct Progress {
    references: Vec<AgentObjectRef>,
    known: BTreeSet<AgentObjectRef>,
    issued: BTreeSet<u32>,
}
#[derive(Serialize)]
struct Record {
    reference: AgentObjectRef,
    projection: RecordValue,
}
impl RecordReads {
    fn reserve(&self, count: usize) -> io::Result<()> {
        self.references
            .fetch_update(Ordering::AcqRel, Ordering::Acquire, |n| {
                n.checked_add(count)
                    .filter(|total| *total <= MAX_REFERENCES)
            })
            .map(|_| ())
            .map_err(|_| io::Error::other("Conversation record inventory limit exceeded"))
    }
    pub(super) fn register(&mut self, session: &AgentSessionSnapshotV1) -> io::Result<Uuid> {
        let mut known = BTreeSet::new();
        let references = session
            .event_batches
            .iter()
            .chain(session.tools.values())
            .chain(&session.evidence)
            .copied()
            .filter(|reference| known.insert(*reference))
            .collect::<Vec<_>>();
        self.reserve(references.len())?;
        let cursor = Uuid::new_v4();
        self.cursors.insert(
            cursor,
            RecordCursor {
                session: session.session_id,
                progress: Mutex::new(Progress {
                    references,
                    known,
                    issued: BTreeSet::from([0]),
                }),
            },
        );
        Ok(cursor)
    }
    pub(super) async fn page(
        &self,
        snapshot: &dyn AgentSnapshotRead,
        call: &BackendCall,
        context: ReadContext<'_>,
        cursor: Uuid,
        after: u32,
    ) -> io::Result<String> {
        let owner = self.cursors.get(&cursor).ok_or_else(invalid)?;
        let mut state = owner.progress.lock().await;
        if !state.issued.contains(&after) || after as usize > state.references.len() {
            return Err(invalid());
        }
        let mut at = after as usize;
        let mut records = Vec::new();
        let mut bytes = 0usize;
        while at < state.references.len() && records.len() < PAGE_OBJECTS {
            let reference = state.references[at];
            let value = snapshot
                .read_object(reference)
                .await
                .map_err(|_| invalid())?;
            if value.kind() != reference.kind {
                return Err(invalid());
            }
            let dependencies = value.dependencies().map_err(|_| invalid())?;
            let record = Record {
                reference,
                projection: RecordValue::new(value, context.conversation, context.thread_graph)?,
            };
            let size = encode(&record)?.len();
            if size > PAGE_BYTES {
                return Err(io::Error::other("Conversation record exceeds page limit"));
            }
            if bytes + size > PAGE_BYTES {
                break;
            }
            let fresh = dependencies
                .into_iter()
                .filter(|v| !state.known.contains(v))
                .collect::<Vec<_>>();
            self.reserve(fresh.len())?;
            for dependency in fresh {
                state.known.insert(dependency);
                state.references.push(dependency);
            }
            bytes += size;
            records.push(record);
            at += 1;
        }
        #[derive(Serialize)]
        struct Page<'a> {
            #[serde(flatten)]
            context: ReadContext<'a>,
            cursor: Uuid,
            session_id: AgentSessionId,
            after_index: u32,
            next_after_index: Option<u32>,
            records: Vec<Record>,
        }
        let next = if at < state.references.len() {
            Some(u32::try_from(at).map_err(|_| invalid())?)
        } else {
            None
        };
        let encoded = encode(&Page {
            context,
            cursor,
            session_id: owner.session,
            after_index: after,
            next_after_index: next,
            records,
        })?;
        call.check()?;
        if let Some(next) = next {
            state.issued.insert(next);
        }
        Ok(encoded)
    }
}
