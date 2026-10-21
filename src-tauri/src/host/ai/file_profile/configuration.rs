use super::*;
pub(super) fn load(
    source: &Source,
    bundled: Option<&PathBuf>,
    verified: &Mutex<Option<(PathBuf, Config)>>,
    vault: Option<&str>,
    compute: BTreeMap<String, Option<BTreeMap<String, String>>>,
) -> io::Result<Option<Ready>> {
    let bytes = match std::fs::symlink_metadata(&source.settings) {
        Err(error) if error.kind() == io::ErrorKind::NotFound => {
            if bundled.is_none() {
                return Ok(None);
            }
            None
        }
        Err(error) => return Err(error),
        Ok(metadata) => {
            if !metadata.is_file() || metadata.len() > 16384 {
                return Err(invalid());
            }
            let mut bytes = Vec::new();
            std::fs::File::open(&source.settings)?
                .take(16385)
                .read_to_end(&mut bytes)?;
            if bytes.len() > 16384 {
                return Err(invalid());
            }
            Some(bytes)
        }
    };
    let repair = |reason: String| {
        io::Error::other(format!(
            "{reason} Update AI configuration at {} and retry.",
            source.settings.display()
        ))
    };
    let settings: Settings = match bytes {
        Some(bytes) => serde_json::from_slice(&bytes).map_err(|_| {
            repair("AI configuration must contain version, bundle and path fields only.".into())
        })?,
        None => Settings {
            version: 1,
            bundle: None,
            path: None,
        },
    };
    if settings.path.as_ref().is_some_and(|paths| {
        paths.is_empty() || paths.len() > 8 || paths.iter().any(|path| !path.is_absolute())
    }) {
        return Err(repair(
            "AI configuration path requires one to eight absolute executable search directories."
                .into(),
        ));
    }
    let bundle_path = settings.bundle.or_else(|| bundled.cloned()).ok_or_else(|| repair("The application AI runtime is missing. Use a complete application bundle or prepare it with pnpm ai:prepare.".into()))?;
    let profile = source.settings.parent().ok_or_else(invalid)?;
    let discovered = lapis_desktop::ai::tooling::selected_paths(profile)?;
    let managed = discovered
        .first()
        .is_some_and(|path| path.starts_with(profile.join("ai-clients/tooling")));
    let paths = if managed {
        discovered
    } else {
        settings.path.unwrap_or(discovered)
    };
    let paths = lapis_desktop::ai::tooling::paths::with_user_bin(paths, &source.home);
    if settings.version != 1
        || !bundle_path.is_absolute()
        || paths.is_empty()
        || paths.len() > 64
        || paths.iter().any(|path| !path.is_absolute())
    {
        return Err(repair("AI configuration requires version 1, an absolute bundle path and one to eight absolute executable search directories.".into()));
    }
    for path in &paths {
        if !path.is_dir() {
            return Err(repair(format!(
                "AI executable search directory is missing or is not a folder: {}.",
                path.display()
            )));
        }
    }
    let mut targets: BTreeMap<String, String> = [
        ("codex", "Codex", "codex-acp"),
        ("cursor", "Cursor", "cursor-agent"),
        ("opencode", "OpenCode", "opencode"),
    ]
    .into_iter()
    .filter(|(_, _, command)| paths.iter().any(|path| path.join(command).is_file()))
    .map(|(id, label, _)| (id.into(), label.into()))
    .collect();
    let config = verified_config(&bundle_path, verified).map_err(|error| repair(format!(
        "AI runtime bundle verification failed at {} ({error}). Restore a verified runtime bundle.", bundle_path.display()
    )))?;
    let path = std::env::join_paths(&paths)
        .map_err(|_| repair("AI executable search directories cannot form a PATH.".into()))?
        .into_string()
        .map_err(|_| repair("AI executable search directories must be valid text.".into()))?;
    let home = source.home.to_str().ok_or_else(invalid)?.to_owned();
    // No inherited compatibility variables, process hooks or renderer-supplied credentials.
    let environment = BTreeMap::from([
        ("HOME".into(), home),
        ("PATH".into(), path),
        ("JJ_ACP_CONTROL_VERSION".into(), "3".into()),
        ("JJ_ACP_CANCEL_GRACE".into(), "2".into()),
        ("JJ_ACP_REAP_TIMEOUT".into(), "2".into()),
    ]);
    let mut local_environments = BTreeMap::new();
    let mut stores = vec![("local".to_owned(), source.providers.clone())];
    if let Some(vault) = vault {
        for id in source.providers.agent_ids(vault).unwrap_or_default() {
            if let Ok(store) = source.providers.for_agent(vault, &id) {
                stores.push((format!("local:profile:{id}"), store));
            }
        }
    }
    for (target, store) in stores {
        // One unavailable provider must not disable independently admitted clients.
        // Its settings command still reports the underlying failure.
        let Ok(status) = store.status() else {
            continue;
        };
        let provider = status.configuration.provider;
        if let Ok(Some(environment)) = local_profile::prepare(
            source,
            &config,
            &store,
            compute.get(&provider).cloned().flatten(),
        ) {
            targets.insert(target.clone(), "Lapis AI".into());
            local_environments.insert(target, environment);
        }
    }
    Ok(Some(Ready {
        executable: config.runtime.acp.ok_or_else(invalid)?,
        environment,
        targets,
        local_environments,
    }))
}
