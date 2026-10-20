use super::{capture_cases, conversations, *};
use jj_store_core::{RepositoryStores, StoreOutcome, StoreRequest};

pub async fn setup(f: &Fixture) -> (Value, Value, Arc<RepositoryStores>) {
    capture_cases::privacy(f);
    let handle = conversations::setup(f).await;
    let created = f.call(conversations::prepare(&handle, 3)).await.unwrap();
    let stores = capture_cases::stores(f, &created);
    let thread = jj_collab::ThreadId::new([6; 16]);
    assert!(matches!(
        stores
            .thread()
            .unwrap()
            .execute(&StoreRequest::new(
                jj_store_model::RequestId::new([6; 16]),
                jj_collab::ThreadCommandV1::CreateConversation {
                    thread_id: thread,
                    title: "An existing source conversation".into(),
                    target: jj_collab::ConversationMetadataTargetV1::Conversation {
                        id: "external:canonical-authorship".into()
                    }
                }
            ))
            .await
            .unwrap(),
        StoreOutcome::Committed(_)
    ));
    (handle, json!(thread), stores)
}
pub async fn view(f: &Fixture, handle: &Value, thread: &Value) -> Value {
    let reply = f
        .call(super::conversation_read_canonical::read(handle, thread))
        .await
        .unwrap();
    serde_json::from_str(reply["data"].as_str().unwrap()).unwrap()
}
pub fn append(handle: &Value, request: u8, thread: &Value, selection: &Value, text: &str) -> Value {
    json!({"type":"appendCanonicalConversationMessage","handle":handle,
        "message":{"requestId":id(request),"threadId":thread,"expectedSelection":selection,"text":text}})
}
pub fn status(handle: &Value, request: u8, thread: &Value) -> Value {
    json!({"type":"canonicalConversationMessageStatus","handle":handle,"requestId":id(request),"threadId":thread})
}
pub fn path(f: &Fixture, request: u8) -> PathBuf {
    conversations::private(f)
        .parent()
        .unwrap()
        .join("canonical-conversation-messages-v1")
        .join(format!("{}.json", id(request)))
}
pub fn record(f: &Fixture, request: u8) -> Value {
    serde_json::from_slice(&std::fs::read(path(f, request)).unwrap()).unwrap()
}
pub fn replace(f: &Fixture, request: u8, record: &Value) {
    use std::os::unix::fs::PermissionsExt;
    let path = path(f, request);
    std::fs::write(&path, serde_json::to_vec(record).unwrap()).unwrap();
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600)).unwrap();
}
/// A valid original command interrupted before publication, using a current
/// expected thread so any accidental replay would actually be able to publish.
pub fn unpublished(mut record: Value, request: u8, current: &Value) -> Value {
    use lapis_desktop::ai::backend::Selection;
    use serde::{Deserialize, Serialize};
    use sha2::{Digest, Sha256};
    #[derive(Deserialize, Serialize)]
    #[serde(rename_all = "camelCase")]
    struct Identity {
        target: jj_collab::ConversationMetadataTargetV1,
        thread_id: jj_collab::ThreadId,
        repository: Option<jj_store_model::RepositoryId>,
    }
    let identity: Identity = serde_json::from_value(record["identity"].clone()).unwrap();
    let source: [u8; 32] = serde_json::from_value(record["source"].clone()).unwrap();
    let selection: Selection = serde_json::from_value(record["selection"].clone()).unwrap();
    let observed: Vec<u8> = serde_json::from_value(current["selection"].clone()).unwrap();
    let actor: jj_store_model::PrincipalId =
        serde_json::from_value(record["actor"].clone()).unwrap();
    let request_id = jj_store_model::RequestId::new([request; 16]);
    let mut digest = Sha256::new_with_prefix(b"lapis-canonical-authored-message-identity-v1\0");
    digest.update(serde_json::from_value::<[u8; 16]>(record["seed"].clone()).unwrap());
    digest.update(serde_json::from_value::<[u8; 32]>(record["fingerprint"].clone()).unwrap());
    digest.update(request_id.as_bytes());
    digest.update(serde_json::to_vec(&(&identity, &observed, (&source, &selection))).unwrap());
    digest.update(actor.as_bytes());
    let mut message = [0; 16];
    message.copy_from_slice(&digest.finalize()[..16]);
    record["message"] = json!(jj_collab::HumanMessageId::new(message));
    record["observed"] = current["selection"].clone();
    record["request"]["request_id"] = json!(request_id);
    record["request"]["command"]["intent"]["message_id"] = record["message"].clone();
    record["request"]["command"]["intent"]["expected_thread"] =
        current["references"]["thread"].clone();
    record["receipt"] = Value::Null;
    record
}
