use crate::host::state::NativeHost;
use lapis_desktop::terminal::policy;
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex, OnceLock, Weak},
};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_lapis_terminal::{
    HostContext, HostPolicy, TerminalExt, TerminalHost,
    runtime::{LaunchSpec, Target},
};

#[derive(Clone)]
struct Admission {
    session: String,
    profile: String,
    path: PathBuf,
    host: NativeHost,
    suspended: bool,
    identity: (u64, u64),
}
#[derive(Clone, Default)]
pub struct DesktopTerminalPolicy(Arc<PolicyState>);
#[derive(Default)]
struct PolicyState {
    entries: Mutex<HashMap<String, Admission>>,
    terminal: OnceLock<Weak<TerminalHost>>,
}

fn context(window: &WebviewWindow) -> Result<HostContext, String> {
    let context = HostContext {
        window: window.label().into(),
        url: window.url().map_err(|e| e.to_string())?.to_string(),
    };
    local(&context)?;
    Ok(context)
}
fn local(context: &HostContext) -> Result<(), String> {
    let url = url::Url::parse(&context.url).map_err(|_| "Invalid Terminal origin")?;
    if context.window != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err("Terminal is unavailable to this window".into());
    }
    Ok(())
}
impl DesktopTerminalPolicy {
    fn admission(&self, context: &HostContext) -> Result<Admission, String> {
        local(context)?;
        self.0
            .entries
            .lock()
            .map_err(|_| "Terminal admission unavailable")?
            .get(&context.window)
            .filter(|entry| !entry.suspended)
            .cloned()
            .ok_or_else(|| "Terminal is disabled or no vault is admitted".into())
    }
    fn release(&self, app: &tauri::AppHandle, window: &str, reload: bool) -> Result<(), String> {
        let mut entries = self
            .0
            .entries
            .lock()
            .map_err(|_| "Terminal admission unavailable")?;
        if reload {
            if let Some(entry) = entries.get_mut(window) {
                entry.suspended = true;
            }
        } else {
            app.terminal().close_window(window).map_err(|e| e.message)?;
            entries.remove(window);
        }
        Ok(())
    }
}
impl HostPolicy for DesktopTerminalPolicy {
    fn authorize(&self, context: &HostContext) -> Result<(), String> {
        let admission = self.admission(context)?;
        let admitted = (|| {
            let services = admission
                .host
                .0
                .lock()
                .map_err(|_| "Vault owner unavailable".to_string())?;
            let root = services
                .vaults
                .get(&admission.session)
                .map_err(|e| e.to_string())?;
            root.verify_physical_root().map_err(|e| e.to_string())
        })();
        if admitted.is_err() {
            // Revocation retires the affected window's PTYs, not another runtime.
            if let Some(host) = self.0.terminal.get().and_then(Weak::upgrade) {
                host.close_window(&context.window).map_err(|e| e.message)?;
            }
            self.0
                .entries
                .lock()
                .map_err(|_| "Terminal admission unavailable")?
                .remove(&context.window);
        }
        admitted
    }
    fn targets(&self, context: &HostContext) -> Result<Vec<Target>, String> {
        self.authorize(context)?;
        Ok(vec![policy::target()])
    }
    fn resolve(&self, context: &HostContext, id: &str) -> Result<LaunchSpec, String> {
        let admission = self.admission(context)?;
        let services = admission
            .host
            .0
            .lock()
            .map_err(|_| "Vault owner unavailable")?;
        policy::resolve(
            services
                .vaults
                .get(&admission.session)
                .map_err(|e| e.to_string())?,
            id,
        )
    }
}

#[tauri::command]
pub async fn desktop_terminal_admit(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    policy: tauri::State<'_, DesktopTerminalPolicy>,
    session_id: String,
) -> Result<(), String> {
    let context = context(&window)?;
    let host = host.inner().clone();
    let policy = policy.inner().clone();
    let app = window.app_handle().clone();
    let _ = policy.0.terminal.set(Arc::downgrade(&app.terminal()));
    tauri::async_runtime::spawn_blocking(move || {
        let (profile, path, identity) = {
            let services = host.0.lock().map_err(|_| "Vault owner unavailable")?;
            let root = services
                .vaults
                .get(&session_id)
                .map_err(|e| e.to_string())?;
            root.verify_physical_root().map_err(|e| e.to_string())?;
            let descriptor = services
                .vaults
                .descriptor(&session_id)
                .map_err(|e| e.to_string())?;
            (
                descriptor.profile_id.clone(),
                root.path().to_path_buf(),
                root.physical_identity().map_err(|e| e.to_string())?,
            )
        };
        let mut entries = policy
            .0
            .entries
            .lock()
            .map_err(|_| "Terminal admission unavailable")?;
        if entries.get(&context.window).is_some_and(|old| {
            old.profile != profile || old.path != path || old.identity != identity
        }) {
            app.terminal()
                .close_window(&context.window)
                .map_err(|e| e.message)?;
        }
        entries.insert(
            context.window,
            Admission {
                session: session_id,
                profile,
                path,
                host,
                suspended: false,
                identity,
            },
        );
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn desktop_terminal_release(
    window: WebviewWindow,
    policy: tauri::State<'_, DesktopTerminalPolicy>,
    reload: bool,
) -> Result<(), String> {
    let context = context(&window)?;
    policy.release(window.app_handle(), &context.window, reload)
}

pub fn close_vault(app: &tauri::AppHandle, session: &str) -> Result<(), String> {
    let policy = app.state::<DesktopTerminalPolicy>();
    let windows: Vec<String> = policy
        .0
        .entries
        .lock()
        .map_err(|_| "Terminal admission unavailable")?
        .iter()
        .filter(|(_, entry)| entry.session == session && !entry.suspended)
        .map(|(window, _)| window.clone())
        .collect();
    for window in windows {
        policy.release(app, &window, false)?;
    }
    Ok(())
}
