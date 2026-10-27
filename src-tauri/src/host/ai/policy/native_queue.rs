//! Saved attribution comes from one host-owned catalog, never target names.
use super::{Error, Launch, Result};
use lapis_app_protocol::queues::{QueueAgent, QueueCaptureTarget, QueueRecipient, QueueSelection};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Entry {
    runner: String,
    agent: QueueAgent,
    recipient: QueueRecipient,
}

const CATALOG: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../config/ai/queue-recipients.json"
));

pub(super) fn selection(launch: &Launch) -> Result<Option<QueueSelection>> {
    let Some(runner) = launch.prepared.environment.0.get("JJ_ACP_RUNNER") else {
        return Ok(None);
    };
    let catalog: Vec<Entry> =
        serde_json::from_str(CATALOG).map_err(|_| Error("agent_not_admitted"))?;
    Ok(catalog
        .into_iter()
        .find(|entry| entry.runner == *runner)
        .map(|entry| QueueSelection {
            target: QueueCaptureTarget {
                id: entry.recipient.id.clone(),
                agent: entry.agent,
                model: None,
                thinking: None,
                execution_mode: None,
            },
            recipient: entry.recipient,
            thinking: None,
        }))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sealed_runner_selects_declared_recipient_without_an_opaque_target_or_label() {
        let (temp, settings, home) = super::super::super::file_profile::tests::fixture();
        let files = super::super::super::file_profile::FileProfile::default();
        files.configure(settings, home).unwrap();
        files.prepare().unwrap();
        let mut launch = files.launch("codex", temp.path()).unwrap().unwrap();
        for (runner, agent, label, token) in [
            (
                "codex",
                QueueAgent::Codex,
                "Codex",
                "jj-store-agent:636f646578;",
            ),
            (
                "cursor",
                QueueAgent::Cursor,
                "Cursor",
                "jj-store-agent:637572736f72;",
            ),
            (
                "opencode",
                QueueAgent::Opencode,
                "OpenCode",
                "jj-store-agent:6f70656e636f6465;",
            ),
            (
                "local",
                QueueAgent::Local,
                "Lapis AI",
                "jj-store-agent:6c6f63616c;",
            ),
        ] {
            launch
                .prepared
                .environment
                .0
                .insert("JJ_ACP_RUNNER".into(), runner.into());
            let metadata = selection(&launch).unwrap().unwrap();
            assert_eq!(metadata.target.agent, agent);
            assert_eq!(metadata.recipient.id, runner);
            assert_eq!(metadata.recipient.label, label);
            assert_eq!(metadata.recipient.token, token);
            assert_eq!(metadata.target.id, metadata.recipient.id);
            assert!(metadata.target.execution_mode.is_none());
        }
        launch
            .prepared
            .environment
            .0
            .insert("JJ_ACP_RUNNER".into(), "opaque-future-client".into());
        assert!(selection(&launch).unwrap().is_none());
        launch.prepared.environment.0.remove("JJ_ACP_RUNNER");
        assert!(selection(&launch).unwrap().is_none());
    }
}
