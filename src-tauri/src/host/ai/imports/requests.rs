use super::Purpose;
use serde::Deserialize;
use uuid::Uuid;
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Request {
    #[serde(rename_all = "camelCase")]
    Open {
        session_id: String,
        #[serde(default)]
        purpose: Purpose,
    },
    Prepare {
        handle: Uuid,
    },
    List {
        handle: Uuid,
        ticket: Uuid,
    },
    Preview {
        handle: Uuid,
        ticket: Uuid,
        selector: String,
    },
    NextCapture {
        handle: Uuid,
        ticket: Uuid,
    },
    ConfirmCapture {
        handle: Uuid,
        ticket: Uuid,
        delivery: Uuid,
    },
    Folders {
        handle: Uuid,
        ticket: Uuid,
        harness: lapis_desktop::ai::imports::Harness,
        #[serde(default)]
        refresh: bool,
    },
    Sessions {
        handle: Uuid,
        ticket: Uuid,
        folder: String,
        after: Option<String>,
    },
    StartPreview {
        handle: Uuid,
        ticket: Uuid,
        selector: String,
        reader: Uuid,
    },
    NextPreview {
        handle: Uuid,
        ticket: Uuid,
        reader: Uuid,
    },
    ReleasePreview {
        handle: Uuid,
        ticket: Uuid,
        reader: Uuid,
    },
    Cancel {
        handle: Uuid,
        ticket: Uuid,
    },
    Close {
        handle: Uuid,
    },
}
