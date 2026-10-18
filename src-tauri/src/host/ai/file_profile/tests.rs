use super::*;
use sha2::{Digest, Sha256};

fn fixture() -> (tempfile::TempDir, PathBuf, PathBuf) {
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
    let mut manifest = format!("version = 1\npackage_version = \"0.1.1\"\ntarget = \"{target}\"\n");
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
fn explicit_file_profile_has_exact_codex_target_and_no_inherited_launch_authority() {
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
