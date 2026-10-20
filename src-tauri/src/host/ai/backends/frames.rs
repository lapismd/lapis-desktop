use jj_collab::ThreadId;
use jj_store_model::RequestId;
use lapis_desktop::ai::backend::{Backend, Selection, SelectionReceipt};
use serde::{Deserialize, Serialize};
use std::io;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    pub version: u8,
    pub session_id: String,
    pub operation: Operation,
}
#[derive(Deserialize)]
#[serde(
    tag = "type",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Operation {
    Read {},
    Select {
        request_id: RequestId,
        expected_revision: u32,
        backend: Backend,
    },
    Status {
        request_id: RequestId,
    },
    Open {
        request_id: RequestId,
    },
    PrepareConversation {
        handle: Uuid,
        request_id: RequestId,
        title: String,
    },
    ConversationStatus {
        handle: Uuid,
        request_id: RequestId,
    },
    ListConversations {
        handle: Uuid,
        cursor: Option<String>,
    },
    EditCanonicalConversation {
        handle: Uuid,
        edit: lapis_desktop::ai::conversations::edits::Input,
    },
    CanonicalConversationEditStatus {
        handle: Uuid,
        request_id: RequestId,
        thread_id: ThreadId,
    },
    AppendConversationMessage {
        handle: Uuid,
        request_id: RequestId,
        conversation_request_id: RequestId,
        text: String,
    },
    ConversationMessageStatus {
        handle: Uuid,
        request_id: RequestId,
        conversation_request_id: RequestId,
    },
    AppendCanonicalConversationMessage {
        handle: Uuid,
        message: lapis_desktop::ai::conversations::messages::canonical::Input,
    },
    CanonicalConversationMessageStatus {
        handle: Uuid,
        request_id: RequestId,
        thread_id: ThreadId,
    },
    ReadConversation {
        handle: Uuid,
        request_id: RequestId,
    },
    ReadCanonicalConversation {
        handle: Uuid,
        thread_id: ThreadId,
    },
    OpenCanonicalConversationRead {
        handle: Uuid,
        thread_id: ThreadId,
    },
    OpenConversationRead {
        handle: Uuid,
        request_id: RequestId,
    },
    ReadConversationTranscript {
        handle: Uuid,
        read_handle: Uuid,
        cursor: Uuid,
        after_sequence: String,
    },
    ReadConversationRecords {
        handle: Uuid,
        read_handle: Uuid,
        cursor: Uuid,
        after_index: u32,
    },
    CloseConversationRead {
        handle: Uuid,
        read_handle: Uuid,
    },
    PrepareCapture {
        handle: Uuid,
        request_id: RequestId,
        conversation_request_id: RequestId,
    },
    PrepareManagedCapture {
        handle: Uuid,
        request_id: RequestId,
        conversation_request_id: RequestId,
        client_id: super::managed::Client,
    },
    PrepareCanonicalManagedCapture {
        handle: Uuid,
        request_id: RequestId,
        thread_id: ThreadId,
        expected_selection: Vec<u8>,
        client_id: super::managed::Client,
        participant: Option<lapis_desktop::ai::conversations::capture_facts::Participant>,
        dispatch_request_id: Option<RequestId>,
    },
    BeginCanonicalDispatch {
        handle: Uuid,
        input: lapis_desktop::ai::conversations::dispatch::Input,
    },
    CanonicalDispatchStatus {
        handle: Uuid,
        request_id: Option<RequestId>,
        thread_id: ThreadId,
    },
    StopCanonicalDispatch {
        handle: Uuid,
        request_id: RequestId,
        thread_id: ThreadId,
    },
    FenceCanonicalDispatch {
        handle: Uuid,
        request_id: RequestId,
        thread_id: ThreadId,
    },
    Close {
        handle: Uuid,
    },
}
impl Request {
    pub fn decode(text: &str) -> io::Result<Self> {
        let bad = || {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid conversation backend frame",
            )
        };
        if text.len() > 1024 * 1024 {
            return Err(bad());
        }
        let value: Self = serde_json::from_str(text).map_err(|_| bad())?;
        let maximum = match &value.operation {
            Operation::AppendConversationMessage { .. }
            | Operation::AppendCanonicalConversationMessage { .. } => 1024 * 1024,
            Operation::BeginCanonicalDispatch { .. } => 8 * 1024,
            _ => 4096,
        };
        if value.version != 1 || value.session_id.len() > 128 || text.len() > maximum {
            return Err(bad());
        }
        Ok(value)
    }
}
#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Opened {
    pub handle: Uuid,
    pub selection: Selection,
}
#[derive(Serialize)]
#[serde(tag = "type", content = "data", rename_all = "camelCase")]
pub enum Reply {
    Selection(Selection),
    Receipt(Option<SelectionReceipt>),
    Opened(Opened),
    Conversation(Option<lapis_desktop::ai::conversations::Conversation>),
    ConversationMessage(Option<lapis_desktop::ai::conversations::messages::MessageWrite>),
    CanonicalConversationMessage(
        Option<lapis_desktop::ai::conversations::messages::canonical::MessageWrite>,
    ),
    ConversationView(Option<String>),
    ConversationCatalog(String),
    ConversationEdit(Option<lapis_desktop::ai::conversations::edits::EditWrite>),
    CanonicalConversationView(Option<String>),
    ConversationRead(Option<super::reads::OpenedRead>),
    TranscriptRange(String),
    ConversationRecords(String),
    Capture(super::capture::Prepared),
    CanonicalCapture(super::canonical_capture::Prepared),
    CanonicalDispatch(Option<lapis_desktop::ai::conversations::dispatch::View>),
    Closed,
}
impl Reply {
    pub fn encode(self) -> io::Result<String> {
        serde_json::to_string(&serde_json::json!({"version":1,"data":self}))
            .map_err(io::Error::other)
    }
}
