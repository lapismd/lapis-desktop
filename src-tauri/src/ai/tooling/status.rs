// Adapted from jj-store agent_execution/tooling/status.rs.
use super::*;
impl Tooling {
    pub async fn status(&self, bundle_ready: bool) -> io::Result<Status> {
        let profile = self.root.parent().unwrap().to_owned();
        let paths = tokio::task::spawn_blocking(move || selected_paths(&profile))
            .await
            .map_err(io::Error::other)??;
        let directories = &paths;
        let probe = |name| {
            let executable = paths::resolve(directories, name);
            async move {
                match executable {
                    Some(path) => paths::probe(&path, directories).await,
                    None => None,
                }
            }
        };
        let (node_version, adapter_version, cli_version, cursor_version) = tokio::join!(
            probe("node"),
            probe("codex-acp"),
            probe("codex"),
            probe("cursor-agent")
        );
        let npm_available = paths::resolve(&paths, "npm").is_some();
        let prerequisites = node_version
            .as_deref()
            .and_then(paths::version)
            .is_some_and(|v| v.0 >= 22)
            && npm_available;
        let (selected, pending) = {
            let state = self
                .state
                .lock()
                .map_err(|_| io::Error::other("AI client status unavailable"))?;
            (
                state.selected,
                state
                    .requests
                    .values()
                    .find(|v| v.state == "installing")
                    .cloned(),
            )
        };
        let adapter = paths::resolve(&paths, "codex-acp");
        let managed = selected.is_some_and(|request| {
            adapter
                .as_ref()
                .is_some_and(|p| p.starts_with(paths::prefix(&self.root, request)))
        });
        let old = adapter_version
            .as_deref()
            .and_then(paths::version)
            .is_some_and(|v| v < paths::version(ADAPTER_VERSION).unwrap())
            || (managed
                && cli_version
                    .as_deref()
                    .and_then(paths::version)
                    .is_some_and(|v| v < paths::version(CODEX_VERSION).unwrap()));
        let state = if pending.is_some() {
            "installing"
        } else if !bundle_ready {
            "bundle_needed"
        } else if adapter.is_none() {
            "adapter_needed"
        } else if cli_version.is_none() {
            "cli_missing"
        } else if old {
            "update_available"
        } else if adapter_version.is_none() {
            "unknown"
        } else {
            "ready"
        };
        let action = if adapter.is_none() || cli_version.is_none() {
            Some(Action::Install)
        } else if old || adapter_version.is_none() {
            Some(Action::Update)
        } else {
            None
        };
        let cursor_detail = if cursor_version.is_some() {
            "Detected on this device. Cursor execution is not yet admitted by this Desktop profile."
        } else {
            "Install using Cursor's setup guide. Cursor execution is not yet admitted by this Desktop profile."
        };
        Ok(Status {
            version: 1, node_version, npm_available,
            install_supported: prerequisites && pending.is_none(),
            install_unavailable: (!prerequisites).then(|| "Install Node.js 22 or newer with npm, then Check again.".into()),
            pending,
            runtimes: vec![Runtime {
                id: "codex".into(), label: "Codex".into(), state: state.into(), adapter_version, cli_version, managed, action,
                detail: format!("Codex CLI and ACP adapter. Private install uses adapter {ADAPTER_VERSION} and CLI {CODEX_VERSION}. Authenticate with Codex before connecting."),
                guide_url: "https://developers.openai.com/codex/cli".into(), target_version: Some(ADAPTER_VERSION.into()), target_cli_version: Some(CODEX_VERSION.into()),
            }, Runtime {
                id: "cursor".into(), label: "Cursor".into(), state: "not_admitted".into(), adapter_version: None, cli_version: cursor_version, managed: false, action: None,
                detail: cursor_detail.into(), guide_url: "https://cursor.com/docs/cli/installation".into(), target_version: None, target_cli_version: None,
            }, Runtime {
                id: "local".into(), label: "Lapis AI".into(), state: if bundle_ready { "ready" } else { "bundle_needed" }.into(),
                adapter_version: None, cli_version: None, managed: true, action: None,
                detail: "Verified ACP, agent, coding tools and compute helpers shipped with the application. External adapters and authentication are separate.".into(),
                guide_url: "https://lapis.md".into(), target_version: None, target_cli_version: None,
            }],
        })
    }
}
