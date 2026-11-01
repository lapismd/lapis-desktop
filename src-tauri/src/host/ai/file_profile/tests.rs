use super::*;
use sha2::{Digest, Sha256};

pub(in crate::host::ai) fn fixture() -> (tempfile::TempDir, PathBuf, PathBuf) {
    let temp = tempfile::tempdir().unwrap();
    let bundle = temp.path().join("bundle");
    let bin = temp.path().join("bin");
    std::fs::create_dir(&bundle).unwrap();
    std::fs::create_dir(&bin).unwrap();
    std::fs::write(bin.join("codex-acp"), b"fixture adapter, never executed").unwrap();
    let target = if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        "aarch64-apple-darwin"
    } else if cfg!(target_os = "macos") {
        "x86_64-apple-darwin"
    } else if cfg!(target_arch = "aarch64") {
        "aarch64-unknown-linux-gnu"
    } else {
        "x86_64-unknown-linux-gnu"
    };
    let mut manifest = format!("version = 1\npackage_version = \"0.2.0\"\ntarget = \"{target}\"\n");
    for name in [
        "lapis-acp",
        "lapis-agent",
        "lapis-agent-tools",
        "lapis-compute",
    ] {
        let body = b"fixture helper, never executed";
        std::fs::write(bundle.join(name), body).unwrap();
        manifest.push_str(&format!(
            "\n[[binary]]\nname = \"{name}\"\npath = \"{name}\"\nsha256 = \"{:x}\"\n",
            Sha256::digest(body)
        ));
    }
    std::fs::write(bundle.join("runtime-manifest.toml"), manifest).unwrap();
    let settings = temp.path().join("ai-runtime.json");
    std::fs::write(
        &settings,
        serde_json::to_vec(&serde_json::json!({"version":1,"bundle":bundle,"path":[bin]})).unwrap(),
    )
    .unwrap();
    let home = temp.path().join("home");
    std::fs::create_dir(&home).unwrap();
    (temp, settings, home)
}

#[test]
fn explicit_file_profile_advertises_only_detected_targets_and_no_inherited_launch_authority() {
    let (temp, settings, home) = fixture();
    let files = FileProfile::default();
    files.configure(settings, home.clone()).unwrap();
    assert!(files.targets().is_empty());
    files.prepare().unwrap();
    assert_eq!(files.targets()[0].id, "codex");
    assert!(!files.contains("cursor"));
    assert!(files.launch("other", temp.path()).unwrap().is_none());
    let root = temp.path().join("vault");
    let launch = files.launch("codex", &root).unwrap().unwrap();
    assert_eq!(launch.directory, root);
    assert_eq!(launch.prepared.directory, root);
    assert!(launch.resume.is_none());
    assert!(launch.prepared.arguments.is_empty());
    assert_eq!(launch.prepared.environment.0.len(), 6);
    assert_eq!(
        launch.prepared.environment.0["HOME"],
        home.to_str().unwrap()
    );
    assert_eq!(launch.prepared.environment.0["JJ_ACP_CONTROL_VERSION"], "3");
    assert_eq!(
        launch.prepared.executable,
        temp.path().join("bundle/lapis-acp").canonicalize().unwrap()
    );
    assert!(
        files
            .configure(temp.path().join("other.json"), home)
            .is_err()
    );
}

#[test]
fn missing_file_profile_is_inert_and_invalid_profiles_never_advertise_a_target() {
    let (_temp, settings, home) = fixture();
    let valid = std::fs::read(&settings).unwrap();
    std::fs::remove_file(&settings).unwrap();
    let missing = FileProfile::default();
    missing.configure(settings.clone(), home.clone()).unwrap();
    missing.prepare().unwrap();
    assert!(missing.targets().is_empty());
    for bytes in [
        b"{}".to_vec(),
        vec![b'x'; 16385],
        b"{\"version\":2}".to_vec(),
    ] {
        std::fs::write(&settings, bytes).unwrap();
        let files = FileProfile::default();
        files.configure(settings.clone(), home.clone()).unwrap();
        assert!(files.prepare().is_err());
        assert!(files.targets().is_empty());
    }
    let mut expanded: serde_json::Value = serde_json::from_slice(&valid).unwrap();
    expanded["program"] = serde_json::json!("/outside");
    std::fs::write(&settings, serde_json::to_vec(&expanded).unwrap()).unwrap();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    assert!(files.prepare().is_err());
}

#[test]
fn tampered_bundles_and_symlinked_configuration_never_become_ready() {
    let (temp, settings, home) = fixture();
    std::fs::write(temp.path().join("bundle/lapis-acp"), b"changed").unwrap();
    let files = FileProfile::default();
    files.configure(settings.clone(), home.clone()).unwrap();
    assert!(files.prepare().is_err());
    assert!(files.targets().is_empty());
    let link = temp.path().join("linked.json");
    std::os::unix::fs::symlink(settings, &link).unwrap();
    let files = FileProfile::default();
    files.configure(link, home).unwrap();
    assert!(files.prepare().is_err());
}

#[test]
fn missing_adapter_directory_identifies_the_configuration_and_repair() {
    let (temp, settings, home) = fixture();
    let missing = temp.path().join("removed-workspace/bin");
    let mut document: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&settings).unwrap()).unwrap();
    document["path"] = serde_json::json!([missing]);
    std::fs::write(&settings, serde_json::to_vec(&document).unwrap()).unwrap();
    let files = FileProfile::default();
    files.configure(settings.clone(), home).unwrap();
    let message = files.prepare().unwrap_err().to_string();
    assert!(message.contains(missing.to_str().unwrap()), "{message}");
    assert!(message.contains(settings.to_str().unwrap()), "{message}");
    assert!(message.contains("Update"), "{message}");
    assert!(files.targets().is_empty());
}

#[test]
fn explicit_path_configuration_retains_its_eight_directory_limit() {
    let (temp, settings, home) = fixture();
    let mut document: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&settings).unwrap()).unwrap();
    document["path"] = serde_json::json!(vec![temp.path().join("bin"); 9]);
    std::fs::write(&settings, serde_json::to_vec(&document).unwrap()).unwrap();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    let message = files.prepare().unwrap_err().to_string();
    assert!(message.contains("one to eight"), "{message}");
    assert!(files.targets().is_empty());
}

#[test]
fn absent_adapter_and_invalid_bundle_have_distinct_repair_messages() {
    let (temp, settings, home) = fixture();
    let adapter = temp.path().join("bin/codex-acp");
    std::fs::remove_file(&adapter).unwrap();
    let files = FileProfile::default();
    files.configure(settings.clone(), home.clone()).unwrap();
    files.prepare().unwrap();
    assert!(files.targets().is_empty());
    std::fs::write(adapter, "fixture, never executed").unwrap();
    std::fs::write(temp.path().join("bundle/lapis-acp"), "tampered").unwrap();
    let files = FileProfile::default();
    files.configure(settings.clone(), home).unwrap();
    let message = files.prepare().unwrap_err().to_string();
    assert!(message.contains("bundle"), "{message}");
    assert!(message.contains("verification"), "{message}");
    assert!(message.contains(settings.to_str().unwrap()), "{message}");
    assert!(files.targets().is_empty());
}

#[test]
fn bundled_helpers_and_managed_client_need_no_checkout_configuration() {
    let (temp, settings, home) = fixture();
    std::fs::remove_file(&settings).unwrap();
    let tooling = temp.path().join("ai-clients");
    let request = "11".repeat(16);
    let bin = tooling.join("tooling").join(&request).join("bin");
    std::fs::create_dir_all(&bin).unwrap();
    std::fs::write(bin.join("codex-acp"), "fixture, never executed").unwrap();
    std::fs::write(
        tooling.join("state.json"),
        serde_json::to_vec(&serde_json::json!({
            "selected": request, "requests": {}
        }))
        .unwrap(),
    )
    .unwrap();
    let files = FileProfile::default();
    files.configure_bundle(temp.path().join("bundle")).unwrap();
    files.configure(settings, home).unwrap();
    assert!(files.bundle_ready());
    files.prepare().unwrap();
    let launch = files.launch("codex", temp.path()).unwrap().unwrap();
    assert!(launch.prepared.environment.0["PATH"].starts_with(bin.to_str().unwrap()));
    assert_eq!(
        launch.prepared.executable,
        temp.path().join("bundle/lapis-acp").canonicalize().unwrap()
    );
}

#[test]
fn obsolete_bundle_package_version_remains_rejected() {
    let (temp, settings, home) = fixture();
    let path = temp.path().join("bundle/runtime-manifest.toml");
    let manifest = std::fs::read_to_string(&path).unwrap();
    assert!(manifest.contains("0.2.0"));
    std::fs::write(&path, manifest.replace("0.2.0", "0.1.1")).unwrap();
    let files = FileProfile::default();
    files.configure(settings, home).unwrap();
    assert!(
        files
            .prepare()
            .unwrap_err()
            .to_string()
            .contains("unsupported_bundle")
    );
    assert!(files.targets().is_empty());
}
