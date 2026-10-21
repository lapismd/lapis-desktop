use super::{CapturedEntry, digest, hex, invalid, privacy, projection::FALLBACK_TIME};
use jj_store_capture::transcript_sanitization::TranscriptSanitizer;
use serde_json::Value;
use std::{collections::HashMap, io};
struct ToolEvidence<'a> {
    native: &'a str,
    name: &'a str,
    state: &'static str,
    input: Option<&'a Value>,
    output: Option<&'a Value>,
}
#[derive(Default)]
pub(super) struct LocalProjection {
    entries: Vec<CapturedEntry>,
    tools: HashMap<String, usize>,
    sequence: u64,
    omitted: bool,
}
fn time(value: &Value) -> String {
    value
        .as_str()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|t| {
            t.to_utc()
                .to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
        })
        .unwrap_or_else(|| FALLBACK_TIME.into())
}
fn millis(value: &Value) -> String {
    value
        .as_i64()
        .and_then(chrono::DateTime::from_timestamp_millis)
        .map(|t| t.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
        .unwrap_or_else(|| FALLBACK_TIME.into())
}
impl LocalProjection {
    fn message(
        &mut self,
        role: &str,
        texts: Vec<&str>,
        created_at: &str,
        sanitizer: &TranscriptSanitizer,
    ) {
        if texts.is_empty() {
            return;
        }
        let Some(text) = privacy::text(sanitizer, serde_json::json!(texts.join("\n\n"))) else {
            self.omitted = true;
            return;
        };
        self.entries.push(CapturedEntry::Message {
            id: format!("message:{}:{}", self.sequence, self.entries.len()),
            created_at: created_at.into(),
            role: if role == "user" { "user" } else { "assistant" },
            text,
        });
    }
    fn tool(
        &mut self,
        evidence: ToolEvidence<'_>,
        created_at: &str,
        sanitizer: &TranscriptSanitizer,
    ) {
        let ToolEvidence {
            native,
            name,
            state,
            input,
            output,
        } = evidence;
        let id = format!(
            "tool:{}",
            hex(&digest(
                b"lapis/import-tool/v1\0",
                format!("{}/{native}", self.sequence).as_bytes()
            ))
        );
        let index = self.entries.len();
        self.entries.push(CapturedEntry::Tool {
            id,
            created_at: created_at.into(),
            name: privacy::label(sanitizer, name, "Tool"),
            state,
            input: input.and_then(|v| privacy::text(sanitizer, v.clone())),
            output: output.and_then(|v| privacy::text(sanitizer, v.clone())),
        });
        self.tools.insert(native.chars().take(256).collect(), index);
    }
    pub fn cursor(&mut self, value: Value, sanitizer: &TranscriptSanitizer) -> io::Result<()> {
        self.sequence += 1;
        if value["type"] == "turn_ended" {
            return Ok(());
        }
        let role = value["role"].as_str().unwrap_or("");
        if !matches!(role, "user" | "assistant") {
            self.omitted = true;
            return Ok(());
        }
        let created_at = time(&value["timestamp"]);
        let Some(parts) = value["message"]["content"].as_array() else {
            self.omitted = true;
            return Ok(());
        };
        let mut texts = Vec::new();
        for (index, part) in parts.iter().enumerate() {
            match part["type"].as_str() {
                Some("text") => {
                    if let Some(text) = part["text"].as_str() {
                        texts.push(text)
                    }
                }
                Some("tool_use") => {
                    self.message(role, std::mem::take(&mut texts), &created_at, sanitizer);
                    if let Some(name) = part["name"].as_str() {
                        self.tool(
                            ToolEvidence {
                                native: part["id"]
                                    .as_str()
                                    .unwrap_or(&format!("{}:{index}", self.sequence)),
                                name,
                                state: "unknown",
                                input: part.get("input"),
                                output: None,
                            },
                            &created_at,
                            sanitizer,
                        )
                    }
                }
                Some("tool_result") => {
                    self.message(role, std::mem::take(&mut texts), &created_at, sanitizer);
                    if let Some(index) = part["tool_use_id"]
                        .as_str()
                        .and_then(|id| self.tools.get(id))
                        .copied()
                    {
                        if let CapturedEntry::Tool { state, output, .. } = &mut self.entries[index]
                        {
                            *state = if part["is_error"] == true {
                                "error"
                            } else {
                                "unknown"
                            };
                            *output = part
                                .get("content")
                                .and_then(|v| privacy::text(sanitizer, v.clone()));
                        }
                    } else {
                        self.omitted = true;
                    }
                }
                _ => self.omitted = true,
            }
        }
        self.message(role, texts, &created_at, sanitizer);
        self.check()
    }
    pub fn opencode(&mut self, value: Value, sanitizer: &TranscriptSanitizer) -> io::Result<()> {
        self.sequence += 1;
        let role = value["info"]["role"].as_str().unwrap_or("");
        if !matches!(role, "user" | "assistant") {
            self.omitted = true;
            return Ok(());
        }
        let created_at = millis(
            &value["info"]["time"]["created"]
                .as_i64()
                .map(serde_json::Value::from)
                .unwrap_or_else(|| value["createdAtMillis"].clone()),
        );
        let Some(parts) = value["parts"].as_array() else {
            self.omitted = true;
            return Ok(());
        };
        let mut texts = Vec::new();
        for part in parts {
            match part["type"].as_str() {
                Some("text") => {
                    if let Some(text) = part["text"].as_str() {
                        texts.push(text)
                    }
                }
                Some("tool") => {
                    self.message(role, std::mem::take(&mut texts), &created_at, sanitizer);
                    let state = match part["state"]["status"].as_str() {
                        Some("completed") => "completed",
                        Some("error") => "error",
                        _ => "unknown",
                    };
                    self.tool(
                        ToolEvidence {
                            native: part["id"].as_str().unwrap_or("observed-tool"),
                            name: part["tool"].as_str().unwrap_or("Tool"),
                            state,
                            input: part["state"].get("input"),
                            output: part["state"]
                                .get("output")
                                .or_else(|| part["state"].get("error")),
                        },
                        &created_at,
                        sanitizer,
                    );
                }
                Some("step-start" | "step-finish") => {}
                _ => self.omitted = true,
            }
        }
        self.message(role, texts, &created_at, sanitizer);
        self.check()
    }
    fn check(&self) -> io::Result<()> {
        if self.entries.len() > 4096
            || serde_json::to_vec(&self.entries)
                .map_err(|_| invalid())?
                .len()
                > 4 * 1024 * 1024
        {
            return Err(invalid());
        }
        Ok(())
    }
    pub fn entries(&self, complete: bool) -> Vec<CapturedEntry> {
        let mut entries = self.entries.clone();
        if complete && (entries.is_empty() || self.omitted) {
            entries.push(CapturedEntry::Notice{id:"omissions:0".into(),created_at:FALLBACK_TIME.into(),text:"Some unsupported or private source records were omitted. Imported history grants no execution or permission authority.".into()});
        }
        entries
    }
}
