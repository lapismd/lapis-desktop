use crate::vault::VaultRoot;
use serde_json::Value;
use std::path::{Path, PathBuf};
use tauri_plugin_lapis_terminal::runtime::{LaunchSpec, Target, shell};

pub const TARGET: &str = "vault-shell";

pub fn target() -> Target {
    Target {
        id: TARGET.into(),
        label: "Vault shell".into(),
    }
}

/// Launch configuration comes from admitted on-disk preferences, never IPC.
pub fn resolve(root: &VaultRoot, id: &str) -> Result<LaunchSpec, String> {
    if id != TARGET {
        return Err("Unknown terminal target".into());
    }
    let settings = match root.read_text(".lapis/terminal.json") {
        Ok(text) if text.len() <= 16 * 1024 => {
            serde_json::from_str::<Value>(&text).map_err(|_| "Invalid Terminal settings")?
        }
        Ok(_) => return Err("Terminal settings are too large".into()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Value::Null,
        Err(error) => return Err(error.to_string()),
    };
    let setting = |name: &str, old: &str| -> Result<String, String> {
        match settings.get(name).or_else(|| settings.get(old)) {
            Some(Value::String(value)) if value.len() <= 4096 && !value.contains('\0') => {
                Ok(value.trim().into())
            }
            Some(Value::Null) | None => Ok(String::new()),
            _ => Err(format!("Invalid Terminal {name} preference")),
        }
    };
    let mut spec = LaunchSpec::new(target(), root.path());
    let preferred_shell = setting("shell", "terminal.shell")?;
    if !preferred_shell.is_empty() {
        let path = Path::new(&preferred_shell);
        if !path.is_absolute() || !shell::is_executable_file(path) {
            return Err("Choose an absolute executable shell file".into());
        }
        spec.shell = preferred_shell;
    }
    let cwd = setting("cwd", "terminal.cwd")?;
    if !cwd.is_empty() {
        let path = PathBuf::from(cwd);
        let absolute = if path.is_absolute() {
            path
        } else {
            root.path().join(path)
        };
        let resolved = absolute
            .canonicalize()
            .map_err(|_| "Terminal start directory is unavailable")?;
        let relative = resolved
            .strip_prefix(root.path())
            .map_err(|_| "Terminal start directory must be inside this vault")?;
        let relative = relative
            .to_str()
            .ok_or("Invalid Terminal start directory")?;
        if root
            .stat(relative)
            .map_err(|e| e.to_string())?
            .is_none_or(|s| s.r#type != "folder")
        {
            return Err("Terminal start directory must be a folder".into());
        }
        spec.cwd = resolved;
    }
    // A replaced or symlinked physical root must not inherit the old admission.
    root.verify_physical_root()
        .map_err(|error| error.to_string())?;
    Ok(spec)
}
