use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use uuid::Uuid;
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
pub struct Settings {
    pub revision: u64,
    pub model: Option<String>,
    pub memory_gb: Option<u64>,
    pub sharing: bool,
    pub peers: BTreeMap<String, Value>,
    pub target_peer: Option<String>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Command {
    pub request_id: Uuid,
    pub expected_revision: u64,
    pub action: Action,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type", deny_unknown_fields, rename_all = "camelCase")]
pub enum Action {
    Configure {
        settings: Settings,
    },
    Prepare,
    Download,
    Start,
    Import {
        path: String,
    },
    Stop {
        #[serde(rename = "ownerId")]
        owner_id: Option<Uuid>,
    },
}
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
pub struct Saved {
    pub settings: Settings,
    pub request: Option<Command>,
    pub outcome: Option<String>,
}
#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct View {
    pub state: String,
    pub invitation: Option<Value>,
    pub progress: Option<Value>,
    pub imported_model: Option<String>,
    pub owner_id: Option<Uuid>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub hardware: Value,
    pub settings: Settings,
    pub request_id: Option<Uuid>,
    pub outcome: Option<String>,
    pub runtime: View,
}
impl Settings {
    pub fn wire(&self) -> Value {
        serde_json::json!({"model": self.model, "memory_gb":self.memory_gb,"sharing":self.sharing,"peers":self.peers,"relay_urls":[]})
    }
    pub fn validate(&self) -> std::io::Result<()> {
        let valid_model = self.model.as_ref().is_none_or(|m| {
            !m.is_empty()
                && m.len() <= 256
                && !m.starts_with('/')
                && !m.contains("..")
                && !m.contains("://")
                && !m.chars().any(char::is_control)
        });
        if !valid_model
            || self.memory_gb.is_some_and(|m| m == 0 || m > 1024)
            || self.peers.len() > 16
            || self
                .target_peer
                .as_ref()
                .is_some_and(|id| !self.peers.contains_key(id))
        {
            return Err(super::unavailable());
        }
        for (id, invitation) in &self.peers {
            if id.len() != 64
                || !id.bytes().all(|c| c.is_ascii_hexdigit())
                || invitation["id"] != *id
                || invitation.to_string().len() > 2048
                || invitation["addrs"]
                    .as_array()
                    .is_none_or(|a| a.is_empty() || a.len() > 16)
            {
                return Err(super::unavailable());
            }
        }
        Ok(())
    }
}
