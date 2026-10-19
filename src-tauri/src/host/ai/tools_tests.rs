use super::tools::{Operation, Request};
use serde_json::json;
use uuid::Uuid;

#[test]
fn application_tool_ipc_rejects_launch_scope_and_identity_overrides() {
    let base = json!({"sessionId":"vault","requestId":Uuid::new_v4(),"operation":{"type":"close"}});
    assert!(serde_json::from_value::<Request>(base.clone()).is_ok());
    for (key, value) in [
        ("window", json!("other")),
        ("generation", json!("forged")),
        ("program", json!("/outside")),
        ("environment", json!({"secret":"forged"})),
    ] {
        let mut frame = base.clone();
        frame[key] = value;
        assert!(serde_json::from_value::<Request>(frame).is_err());
    }
    for operation in [
        json!({"type":"open","tools":[],"root":"/outside"}),
        json!({"type":"reply","invocationId":Uuid::new_v4(),"outcome":{"type":"unknown","value":"extra"}}),
    ] {
        let mut frame = base.clone();
        frame["operation"] = operation;
        assert!(serde_json::from_value::<Request>(frame).is_err());
    }
    assert!(
        serde_json::from_value::<Operation>(json!({"type":"execute","name":"fs.write"})).is_err()
    );
}
