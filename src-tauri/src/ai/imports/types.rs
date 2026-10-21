use serde::Serialize;
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRow {
    pub selector: String,
    pub title: String,
    pub profile: String,
    pub updated_at: String,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSource {
    pub kind: &'static str,
    pub profile: String,
    pub session_key: String,
    pub snapshot_key: String,
}
#[derive(Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum CapturedEntry {
    #[serde(rename_all = "camelCase")]
    Message {
        id: String,
        created_at: String,
        role: &'static str,
        text: String,
    },
    #[serde(rename_all = "camelCase")]
    Tool {
        id: String,
        created_at: String,
        name: String,
        state: &'static str,
        #[serde(skip_serializing_if = "Option::is_none")]
        input: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        output: Option<String>,
    },
    #[serde(rename_all = "camelCase")]
    Notice {
        id: String,
        created_at: String,
        text: String,
    },
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapturedSession {
    pub version: u32,
    pub source: ImportSource,
    pub created_at: String,
    pub entries: Vec<CapturedEntry>,
}
