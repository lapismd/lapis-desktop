use lapis_app_core::vault::VaultRoot;
use lapis_desktop::terminal::policy::{TARGET, resolve};
use std::fs;

#[test]
fn native_preferences_select_only_valid_executable_and_admitted_cwd() {
    let dir = tempfile::tempdir().unwrap();
    fs::create_dir_all(dir.path().join(".lapis")).unwrap();
    fs::create_dir_all(dir.path().join("notes")).unwrap();
    let root = VaultRoot::open(dir.path()).unwrap();
    assert_eq!(resolve(&root, TARGET).unwrap().cwd, root.path());
    fs::write(
        dir.path().join(".lapis/terminal.json"),
        r#"{"terminal.shell":"/bin/sh","terminal.cwd":"notes"}"#,
    )
    .unwrap();
    let spec = resolve(&root, TARGET).unwrap();
    assert_eq!(spec.shell, "/bin/sh");
    assert_eq!(spec.cwd, root.path().join("notes"));
    for text in [
        r#"{"shell":"/tmp"}"#,
        r#"{"shell":"relative"}"#,
        r#"{"cwd":"/etc"}"#,
        r#"{"cwd":"../"}"#,
        r#"{"shell":3}"#,
        "invalid",
    ] {
        fs::write(dir.path().join(".lapis/terminal.json"), text).unwrap();
        assert!(resolve(&root, TARGET).is_err(), "{text}");
    }
    assert!(resolve(&root, "/bin/sh -c anything").is_err());
}

#[test]
fn replaced_physical_root_cannot_launch_using_an_old_admission() {
    let parent = tempfile::tempdir().unwrap();
    let path = parent.path().join("vault");
    fs::create_dir(&path).unwrap();
    let root = VaultRoot::open(&path).unwrap();
    fs::rename(&path, parent.path().join("old")).unwrap();
    fs::create_dir(&path).unwrap();
    assert!(resolve(&root, TARGET).is_err());
}
