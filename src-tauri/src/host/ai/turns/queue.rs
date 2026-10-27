//! Generated queue data passes through the same admitted Core owner as turns.
use crate::host::state::{NativeError, NativeHost};
use lapis_app_protocol::queues::{QueueCommand, QueueValue};
use serde::Deserialize;
use std::io;
use tauri::WebviewWindow;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    command: QueueCommand,
}

#[tauri::command]
pub async fn desktop_ai_queue(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: Request,
) -> Result<QueueValue, NativeError> {
    super::access::call(window, host, request.session_id, move |client| {
        client.call_queue(request.command).map_err(io::Error::other)
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn queue_frames_preserve_exact_typed_ids_and_refuse_browser_authority() {
        let conversation = "11111111-1111-4111-8111-111111111111";
        let frame =
            json!({"sessionId":"vault","command":{"kind":"read","conversation_id":conversation}});
        let acceptance = "22222222-2222-4222-8222-222222222222";
        let head = "33333333-3333-4333-8333-333333333333";
        for command in [
            frame["command"].clone(),
            json!({"kind":"stop","conversation_id":conversation}),
            json!({"kind":"cancel","conversation_id":conversation,"acceptance_id":acceptance}),
            json!({"kind":"resume","conversation_id":conversation,"after_request_id":head}),
            json!({"kind":"accept","input":{
                "acceptance_id":acceptance,"conversation_id":conversation,"after_request_id":head,
                "scope_dir":"Notes","target_id":"opaque-native-target","capture":{"version":1}
            }}),
        ] {
            let request =
                serde_json::from_value::<Request>(json!({"sessionId":"vault","command":command}))
                    .unwrap();
            assert_eq!(request.session_id, "vault");
            assert_eq!(serde_json::to_value(request.command).unwrap(), command);
        }
        for field in ["window", "root", "generation", "credentials", "executable"] {
            let mut forged = frame.clone();
            forged[field] = json!("untrusted");
            assert!(serde_json::from_value::<Request>(forged).is_err());
        }
        for command in [
            json!({"kind":"read","conversation_id":"invalid"}),
            json!({"kind":"read","conversation_id":conversation,"root":"/other"}),
            json!({"kind":"resume","conversation_id":conversation}),
            json!({"kind":"cancel","conversation_id":conversation,"acceptance_id":"invalid"}),
        ] {
            assert!(
                serde_json::from_value::<Request>(json!({"sessionId":"vault","command":command}))
                    .is_err()
            );
        }
    }
}
