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
        if text.len() > 4096 {
            return Err(bad());
        }
        let value: Self = serde_json::from_str(text).map_err(|_| bad())?;
        if value.version != 1 || value.session_id.len() > 128 {
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
    Closed,
}
impl Reply {
    pub fn encode(self) -> io::Result<String> {
        serde_json::to_string(&serde_json::json!({"version":1,"data":self}))
            .map_err(io::Error::other)
    }
}
