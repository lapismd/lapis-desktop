//! Compiled ACP JSON-RPC peer; excluded unless the e2e feature is explicit.
use serde_json::{Value, json};
use std::{
    fs::OpenOptions,
    io::{BufRead, Write},
};

fn emit(value: Value) {
    let mut out = std::io::stdout().lock();
    serde_json::to_writer(&mut out, &value).unwrap();
    writeln!(out).unwrap();
    out.flush().unwrap();
}
fn reply(id: Value, result: Value) {
    emit(json!({"jsonrpc":"2.0","id":id,"result":result}));
}
fn message(text: &str) {
    emit(json!({"jsonrpc":"2.0","method":"session/update","params":{
        "sessionId":"native-provider", "update":{"sessionUpdate":"agent_message_chunk", "content":{"type":"text","text":text}}
    }}));
}
fn main() {
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(std::env::var("LAPIS_ACP_FIXTURE_LOG").unwrap())
        .unwrap();
    writeln!(log, "{}", json!({"pid":std::process::id()})).unwrap();
    log.flush().unwrap();
    let mut pending: Option<Value> = None;
    for line in std::io::stdin().lock().lines() {
        let frame: Value = serde_json::from_str(&line.unwrap()).unwrap();
        writeln!(log, "{frame}").unwrap();
        log.flush().unwrap();
        let id = frame["id"].clone();
        match frame["method"].as_str() {
            Some("initialize") => reply(
                id,
                json!({"protocolVersion":2,"agentCapabilities":{"promptCapabilities":{"embeddedContext":true}}}),
            ),
            Some("session/new") => reply(
                id,
                json!({"sessionId":"native-provider","modes":{"currentModeId":"ask","availableModes":[{"id":"ask","name":"Ask"}]},"configOptions":[{"id":"mode","name":"Mode","category":"mode","type":"select","currentValue":"ask","options":[{"value":"ask","name":"Ask"}]}]}),
            ),
            Some("session/prompt") => {
                let text = frame["params"]["prompt"]
                    .as_array()
                    .unwrap()
                    .last()
                    .unwrap()["text"]
                    .as_str()
                    .unwrap();
                if text == "crash" {
                    std::process::exit(9);
                }
                if text == "permission" || text == "wait" {
                    pending = Some(id);
                    emit(
                        json!({"jsonrpc":"2.0","id":"exact-choice","method":"session/request_permission","params":{
                            "sessionId":"native-provider","toolCall":{"toolCallId":"read","title":"Read fixture"},
                            "options":[{"optionId":"custom:allow-one","name":"Allow once","kind":"allow_once"},{"optionId":"custom:deny","name":"Deny","kind":"reject_once"}]
                        }}),
                    );
                } else if text.starts_with("privacy:") {
                    let root = std::env::current_dir().unwrap().canonicalize().unwrap();
                    let root = root.to_str().unwrap();
                    let split = root.char_indices().nth(root.chars().count() / 2).unwrap().0;
                    message(&format!("See {}", &root[..split]));
                    message(&format!("{}/note.md fixture-", &root[split..]));
                    #[rustfmt::skip]
                    message(&format!("native-secret {}", format!("ghp_{}", "NQLObn7M3OTKBL44TH6K9WxFY39LZM1sDc0K")));
                    reply(id, json!({"stopReason":"end_turn"}));
                } else if text.starts_with("batch:") {
                    message("A fixture-native-");
                    message("secret answer");
                    reply(id, json!({"stopReason":"end_turn"}));
                } else {
                    message(text);
                    reply(id, json!({"stopReason":"end_turn"}));
                }
            }
            Some("session/cancel") => {
                if let Some(id) = pending.take() {
                    reply(id, json!({"stopReason":"cancelled"}));
                }
            }
            Some(_) if !id.is_null() => reply(id, json!({})),
            None if id == "exact-choice" => {
                if let Some(id) = pending.take() {
                    if frame["result"]["outcome"]["outcome"] == "cancelled" {
                        reply(id, json!({"stopReason":"cancelled"}));
                    } else {
                        message("permission answered");
                        reply(id, json!({"stopReason":"end_turn"}));
                    }
                }
            }
            _ => {}
        }
    }
}
