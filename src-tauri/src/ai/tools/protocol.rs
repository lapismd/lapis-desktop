use lapis_ai_app_tools::Tool;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ToolSpec {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}
impl From<ToolSpec> for Tool {
    fn from(tool: ToolSpec) -> Self {
        Self {
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema,
        }
    }
}
// Never derive Debug: the authentication frame contains a private credential.
#[derive(Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub(super) enum Request {
    Snapshot {
        credential: String,
    },
    Call {
        credential: String,
        name: String,
        arguments: Value,
    },
}
#[derive(Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub(super) enum Response {
    Snapshot { tools: Vec<ToolSpec> },
    Result { outcome: Outcome },
}
#[derive(Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub enum Outcome {
    Completed { value: Value },
    Rejected {},
    Invalid {},
    Unknown {},
}
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Event {
    #[serde(rename_all = "camelCase")]
    Call {
        bridge_id: Uuid,
        invocation_id: Uuid,
        turn_id: Uuid,
        name: String,
        arguments: Value,
    },
    #[serde(rename_all = "camelCase")]
    Cancel {
        bridge_id: Uuid,
        invocation_id: Uuid,
    },
}
