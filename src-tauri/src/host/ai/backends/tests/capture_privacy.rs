use super::*;
use std::os::unix::fs::PermissionsExt;

#[test]
fn native_scanner_cache_is_private_reused_and_retained_until_each_policy_drops() {
    let root = tempfile::tempdir().unwrap();
    let root = root.path().canonicalize().unwrap();
    let home = root.join("home");
    let temporary = root.join("temporary");
    let vault = root.join("vault");
    let other = root.join("other-vault");
    for path in [&home, &temporary, &vault, &other] {
        std::fs::create_dir(path).unwrap();
    }
    assert!(super::super::privacy::Roots::new(home.clone(), home.clone()).is_err());
    let roots = super::super::privacy::Roots::new(home, temporary.clone()).unwrap();
    let first = roots
        .for_workspace(&vault, &["native-only-secret".into()])
        .unwrap();
    let second = roots.for_workspace(&other, &[]).unwrap();
    let caches: Vec<_> = std::fs::read_dir(&temporary).unwrap().collect();
    assert_eq!(caches.len(), 1);
    let cache = caches.into_iter().next().unwrap().unwrap().path();
    assert_eq!(
        std::fs::metadata(&cache).unwrap().permissions().mode() & 0o777,
        0o700
    );
    let first_value: Value = serde_json::from_slice(
        first
            .sanitizer
            .sanitize(json!({"text":format!("{} native-only-secret", vault.display())}))
            .unwrap()
            .bytes(),
    )
    .unwrap();
    let second_value: Value = serde_json::from_slice(
        second
            .sanitizer
            .sanitize(json!({"text":other}))
            .unwrap()
            .bytes(),
    )
    .unwrap();
    assert_eq!(first_value["text"], "$WORKSPACE $SECRET");
    assert_eq!(second_value["text"], "$WORKSPACE");
    drop(roots);
    assert!(cache.exists());
    drop(first);
    assert!(cache.exists());
    drop(second);
    assert!(!cache.exists());
}
