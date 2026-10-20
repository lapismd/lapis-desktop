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
        if value.version != 1
            || value.session_id.len() > 128
            || text.len() > 4096
                && !matches!(
                    &value.operation,
                    Operation::AppendConversationMessage { .. }
                )
        {
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
    ConversationView(Option<String>),
    ConversationCatalog(String),
    CanonicalConversationView(Option<String>),
    ConversationRead(Option<super::reads::OpenedRead>),
    TranscriptRange(String),
    Capture(super::capture::Prepared),
    Closed,
}
impl Reply {
    pub fn encode(self) -> io::Result<String> {
        serde_json::to_string(&serde_json::json!({"version":1,"data":self}))
            .map_err(io::Error::other)
    }
}
