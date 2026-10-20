use super::*;
use tauri_plugin_lapis_ai::runtime::{Component, Resolver};
struct NoInheritedSecrets;
impl Resolver for NoInheritedSecrets {
    fn environment(&self, _: &str) -> Option<String> {
        None
    }
}
pub(super) fn plan(profile: &FileProfile) -> io::Result<PreparedLaunch> {
    let source = profile.source.get().ok_or_else(invalid)?;
    let explicit = match std::fs::symlink_metadata(&source.settings) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => None,
        Ok(meta) if meta.is_file() && meta.len() <= 16384 => {
            let settings: Settings =
                serde_json::from_slice(&std::fs::read(&source.settings)?).map_err(|_| invalid())?;
            if settings.version != 1 {
                return Err(invalid());
            }
            settings.bundle
        }
        _ => return Err(invalid()),
    };
    let bundle = explicit
        .as_ref()
        .or(profile.bundle.get())
        .ok_or_else(invalid)?;
    let mut config = verified_config(bundle, &profile.verified)?;
    config.runtime.data_dir = Some(
        source
            .settings
            .parent()
            .ok_or_else(invalid)?
            .join("ai-compute"),
    );
    PreparedLaunch::new(&config, Component::Compute, &NoInheritedSecrets).map_err(|_| invalid())
}
