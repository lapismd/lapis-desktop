//! Isolated native policy for the reusable transport gate; e2e builds only.
use std::{
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
};
use tauri::Manager;
use tauri_plugin_lapis_ai::{
    AiExt, Error, HostContext, HostPolicy, Launch, Result, Target,
    runtime::{Environment, PreparedLaunch},
};

#[derive(Clone, Default)]
pub struct Policy(Arc<AtomicU64>);
fn root() -> Result<PathBuf> {
    let root =
        PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT").map_err(|_| Error("denied"))?);
    if !root.is_absolute() {
        return Err(Error("denied"));
    }
    root.canonicalize().map_err(|_| Error("denied"))
}
fn resources() -> Result<PathBuf> {
    std::env::current_exe()
        .map_err(|_| Error("denied"))?
        .parent()
        .and_then(|path| path.parent())
        .map(|path| path.join("Resources/native"))
        .ok_or(Error("denied"))
}
impl HostPolicy for Policy {
    fn authorize(&self, context: &HostContext) -> Result<String> {
        let url = url::Url::parse(&context.url).map_err(|_| Error("denied"))?;
        if context.window != "main" || !crate::navigation::allowed(&url, false) {
            return Err(Error("denied"));
        }
        root()?;
        Ok(format!("acp-acceptance-{}", self.0.load(Ordering::Acquire)))
    }
    fn targets(&self, _: &HostContext) -> Result<Vec<Target>> {
        Ok(vec![Target {
            id: "compiled-fixture".into(),
            label: "Compiled native fixture".into(),
        }])
    }
    fn resolve(&self, context: &HostContext, target: &str, resume: Option<&str>) -> Result<Launch> {
        self.authorize(context)?;
        if target != "compiled-fixture" || resume.is_some() {
            return Err(Error("denied"));
        }
        let root = root()?;
        let native = resources()?;
        let catalog = root.join("acp-catalog.json");
        let provider = native.join("lapis-acp-native-fixture");
        std::fs::write(
            &catalog,
            serde_json::json!({"runners":[{
                "id":"fixture", "label":"Compiled fixture", "command":provider,
                "args":[], "env":{"LAPIS_ACP_FIXTURE_LOG":root.join("acp-peer.jsonl")}
            }]})
            .to_string(),
        )
        .map_err(|_| Error("denied"))?;
        let mut environment = Environment::default();
        for (key, value) in [
            ("PATH", "/usr/bin:/bin".to_string()),
            ("JJ_ACP_RUNNER", "fixture".into()),
            ("JJ_ACP_CATALOG", catalog.to_string_lossy().into()),
            ("JJ_ACP_CANCEL_GRACE", "1".into()),
            ("JJ_ACP_REAP_TIMEOUT", "1".into()),
        ] {
            environment.0.insert(key.into(), value);
        }
        Ok(Launch {
            prepared: PreparedLaunch {
                executable: native.join("lapis-acp"),
                arguments: vec![],
                directory: root.clone(),
                environment,
            },
            directory: root,
            resume: None,
        })
    }
}
#[tauri::command]
pub async fn acp_acceptance_control(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    operation: String,
) -> std::result::Result<(), String> {
    if window.label() != "main" {
        return Err("denied".into());
    }
    let host = app.ai();
    match operation.as_str() {
        "disable" => host.disable().await,
        "enable" => host.enable(),
        "other-window" => tauri::WebviewWindowBuilder::new(
            &app,
            "acp-other",
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title("ACP isolation acceptance")
        .visible(false)
        .build()
        .map(|_| ())
        .map_err(|_| Error("window_unavailable")),
        "revoke" => {
            app.state::<Policy>().0.fetch_add(1, Ordering::AcqRel);
            host.revoke("main", None).await
        }
        _ => Err(Error("denied")),
    }
    .map_err(|error| error.to_string())
}
