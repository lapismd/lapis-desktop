use super::*;
use sha2::{Digest, Sha256};

pub(super) fn prepare(
    source: &Source,
    config: &Config,
    compute: Option<BTreeMap<String, String>>,
) -> io::Result<Option<BTreeMap<String, String>>> {
    let mut environment = if source.providers.compute_selected().unwrap_or(false) {
        match compute {
            Some(environment) => environment,
            None => return Ok(None),
        }
    } else {
        match source.providers.environment() {
            Ok(environment) => environment,
            Err(_) => return Ok(None),
        }
    };
    environment.insert("BUZZ_AGENT_NO_HINTS".into(), "1".into());
    let executable = config.runtime.agent.as_ref().ok_or_else(invalid)?;
    let data = serde_json::to_vec(&serde_json::json!({"runners":[{
        "id":"local", "label":"Lapis AI", "command":executable, "args":[], "env":{}
    }]}))
    .map_err(|_| invalid())?;
    let root = source
        .settings
        .parent()
        .ok_or_else(invalid)?
        .join("ai-providers/runtime");
    std::fs::create_dir_all(&root)?;
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700))?;
    // Content-addressed launch metadata stays stable across overlapping starts.
    // It contains no provider credentials and is never removed during a live launch.
    let path = root.join(format!("{:x}.json", Sha256::digest(&data)));
    if !path.exists() {
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)?;
        use std::io::Write;
        file.write_all(&data)?;
        file.sync_all()?;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
    } else if !std::fs::symlink_metadata(&path)?.is_file() || std::fs::read(&path)? != data {
        return Err(invalid());
    }
    environment.insert(
        "JJ_ACP_CATALOG".into(),
        path.to_str().ok_or_else(invalid)?.into(),
    );
    Ok(Some(environment))
}
