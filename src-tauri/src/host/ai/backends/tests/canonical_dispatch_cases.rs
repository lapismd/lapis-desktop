use super::*;

pub fn begin(
    handle: &Value,
    request: u8,
    thread: &Value,
    selection: &Value,
    authored: bool,
) -> Value {
    json!({"type":"beginCanonicalDispatch","handle":handle,"input":{
        "requestId":id(request),"threadId":thread,"expectedSelection":selection,"authored":authored,
        "recipients":[{"requestId":id(request+1),"participant":null}]}})
}
pub fn status(handle: &Value, request: Option<u8>, thread: &Value) -> Value {
    json!({"type":"canonicalDispatchStatus","handle":handle,"threadId":thread,"requestId":request.map(id)})
}
pub fn stop(handle: &Value, request: u8, thread: &Value) -> Value {
    json!({"type":"stopCanonicalDispatch","handle":handle,"threadId":thread,"requestId":id(request)})
}
pub fn prepare(
    handle: &Value,
    request: u8,
    parent: u8,
    thread: &Value,
    selection: &Value,
) -> Value {
    let mut value = super::canonical_capture_cases::prepare(handle, request, thread, selection);
    value["dispatchRequestId"] = json!(id(parent));
    value
}
pub fn path(f: &Fixture, thread: &Value, request: u8) -> PathBuf {
    super::capture_cases::profile(f)
        .join("canonical-dispatch-v1")
        .join(thread.as_str().unwrap())
        .join(format!("{}.json", id(request)))
}
pub fn saved(f: &Fixture, thread: &Value, request: u8) -> Value {
    serde_json::from_slice(&std::fs::read(path(f, thread, request)).unwrap()).unwrap()
}
