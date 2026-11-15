use lapis_app_core::{
    sync::account::protected::{HostAccountCustody, HostSecretBytes},
    vault::VaultRoot,
};
use lapis_desktop::sync::custody::AccountCustody;
use std::io;
const KEY: &str =
    "lapis.sync.account.v1.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

#[test]
fn custody_namespaces_are_stable_per_captured_profile_and_distinct_between_profiles() {
    let temp = tempfile::tempdir().unwrap();
    for name in ["first", "second"] {
        std::fs::create_dir(temp.path().join(name)).unwrap();
    }
    let first = VaultRoot::open(&temp.path().join("first")).unwrap();
    let second = VaultRoot::open(&temp.path().join("second")).unwrap();
    let custody = AccountCustody::for_profile(&first).unwrap();
    assert_eq!(
        custody.service_name(),
        AccountCustody::for_profile(&first).unwrap().service_name()
    );
    assert_ne!(
        custody.service_name(),
        AccountCustody::for_profile(&second).unwrap().service_name()
    );
    assert!(
        custody
            .service_name()
            .starts_with("org.lapismd.desktop.sync.account.v1.")
    );
    assert!(
        !custody
            .service_name()
            .contains(first.path().to_str().unwrap())
    );
    assert_eq!(custody.supported(), cfg!(target_os = "macos"));
    assert!(std::fs::read_dir(first.path()).unwrap().next().is_none());
}
#[test]
fn invalid_item_keys_and_replaced_profile_roots_refuse_before_os_access() {
    let temp = tempfile::tempdir().unwrap();
    let path = temp.path().join("profile");
    std::fs::create_dir(&path).unwrap();
    let profile = VaultRoot::open(&path).unwrap();
    let custody = AccountCustody::for_profile(&profile).unwrap();
    let value = HostSecretBytes::new(b"task-owned-test-custody-payload".to_vec()).unwrap();
    for key in [
        "",
        "arbitrary-key",
        "lapis.sync.account.v1.bad",
        &KEY.to_uppercase(),
        &format!("{KEY}/other"),
    ] {
        assert_eq!(
            custody.read(key).err().unwrap().kind(),
            io::ErrorKind::InvalidInput
        );
        assert_eq!(
            custody.write(key, &value).unwrap_err().kind(),
            io::ErrorKind::InvalidInput
        );
    }
    let service = custody.service_name().to_owned();
    std::fs::rename(&path, temp.path().join("old-profile")).unwrap();
    std::fs::create_dir(&path).unwrap();
    assert!(AccountCustody::for_profile(&profile).is_err());
    assert_ne!(
        custody.read(KEY).err().unwrap().kind(),
        io::ErrorKind::Unsupported
    );
    assert_ne!(
        custody.write(KEY, &value).unwrap_err().kind(),
        io::ErrorKind::Unsupported
    );
    let replacement = AccountCustody::for_profile(&VaultRoot::open(&path).unwrap()).unwrap();
    assert_ne!(replacement.service_name(), service);
    assert!(std::fs::read_dir(&path).unwrap().next().is_none());
}
#[cfg(not(target_os = "macos"))]
#[test]
fn unsupported_platform_refuses_custody_without_plaintext_or_other_provider() {
    let temp = tempfile::tempdir().unwrap();
    let profile = VaultRoot::open(temp.path()).unwrap();
    let custody = AccountCustody::for_profile(&profile).unwrap();
    let value = HostSecretBytes::new(b"task-owned-test-custody-payload".to_vec()).unwrap();
    assert!(!custody.supported());
    assert_eq!(
        custody.read(KEY).err().unwrap().kind(),
        io::ErrorKind::Unsupported
    );
    assert_eq!(
        custody.write(KEY, &value).unwrap_err().kind(),
        io::ErrorKind::Unsupported
    );
    assert!(std::fs::read_dir(profile.path()).unwrap().next().is_none());
}
