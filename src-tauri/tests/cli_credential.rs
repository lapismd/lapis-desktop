#![cfg(unix)]
use lapis_desktop::cli::credential;
use std::{
    fs,
    os::unix::fs::{PermissionsExt, symlink},
};
#[test]
fn exported_credentials_are_private_and_never_overwrite_existing_entries() {
    let temporary = tempfile::tempdir().unwrap();
    let path = temporary.path().join("private.token");
    credential::write_new(&path, "fixture secret").unwrap();
    assert_eq!(
        fs::metadata(&path).unwrap().permissions().mode() & 0o777,
        0o600
    );
    assert!(credential::write_new(&path, "replacement").is_err());
    assert_eq!(fs::read_to_string(&path).unwrap(), "fixture secret");
    let link = temporary.path().join("link.token");
    symlink(&path, &link).unwrap();
    assert!(credential::write_new(&link, "replacement").is_err());
    let command = credential::command("http://127.0.0.1:43210", &path);
    assert!(!command.contains("fixture secret"));
    assert!(command.contains("--token-file"));
}
#[test]
fn vault_and_symlink_alias_destinations_are_refused_before_creation() {
    let temporary = tempfile::tempdir().unwrap();
    let vault = temporary.path().join("vault");
    fs::create_dir(&vault).unwrap();
    let alias = temporary.path().join("alias");
    symlink(&vault, &alias).unwrap();
    for root in [&vault, &alias] {
        assert!(
            credential::destination(&root.join("secret.token"), std::slice::from_ref(&vault))
                .is_err()
        );
        assert!(!root.join("secret.token").exists());
    }
    assert!(credential::destination(&temporary.path().join("outside.token"), &[vault]).is_ok());
}
