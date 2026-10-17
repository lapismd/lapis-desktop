use lapis_desktop::{
    repository::RepositoryAdmissions,
    vault::{VaultManager, admission::VaultAdmissions},
};
use std::{path::Path, process::Command};
fn jj(root: &Path, args: &[&str]) -> String {
    let output = Command::new(
        std::env::var_os("JJ_STORE_TEST_STOCK_JJ").unwrap_or_else(|| "/opt/homebrew/bin/jj".into()),
    )
    .current_dir(root)
    .args([
        "--no-pager",
        "--config",
        "user.name='Fixture'",
        "--config",
        "user.email='fixture@invalid'",
    ])
    .args(args)
    .env("JJ_CONFIG", "/dev/null")
    .env("GIT_CONFIG_NOSYSTEM", "1")
    .env("GIT_CONFIG_GLOBAL", "/dev/null")
    .output()
    .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8(output.stdout).unwrap()
}
fn fixture(colocate: bool) -> (tempfile::TempDir, VaultManager, String) {
    let root = tempfile::tempdir().unwrap();
    let path = root.path().join("Vault 笔记");
    std::fs::create_dir(&path).unwrap();
    jj(
        &path,
        &[
            "git",
            "init",
            if colocate {
                "--colocate"
            } else {
                "--no-colocate"
            },
        ],
    );
    std::fs::write(path.join("note.md"), "committed\n").unwrap();
    jj(&path, &["describe", "-m", "saved"]);
    std::fs::write(path.join("note.md"), "dirty\n").unwrap();
    let mut vaults = VaultManager::new(&root.path().join("profile")).unwrap();
    let session = vaults.select(Some(path), None).unwrap().unwrap().session_id;
    (root, vaults, session)
}
#[test]
fn pending_and_ai_grants_never_authorize_repository_reads() {
    let (_root, vaults, session) = fixture(true);
    let mut ai = VaultAdmissions::default();
    let plan = ai.prepare(&vaults, "main", &session).unwrap();
    ai.complete(&vaults, &plan).unwrap();
    let mut repo = RepositoryAdmissions::default();
    assert!(repo.authorize(&vaults, "main", &session).is_err());
    let pending = repo.prepare(&vaults, "main", &session).unwrap();
    assert!(!pending.preserves_reads());
    assert!(repo.authorize(&vaults, "main", &session).is_err());
    let grant = repo.complete(&vaults, &pending).unwrap();
    assert!(repo.check(&vaults, &grant).is_ok());
    assert!(repo.authorize(&vaults, "other", &session).is_err());
    assert!(repo.authorize(&vaults, "main", "other").is_err());
    ai.leave("main", false);
    assert!(repo.check(&vaults, &grant).is_ok());
    repo.leave("main", false);
    assert!(repo.check(&vaults, &grant).is_err());
}
#[test]
fn reload_preserves_verified_source_but_retirement_rotates_generation_and_stale_tickets_reject() {
    let (_root, vaults, session) = fixture(false);
    let mut repo = RepositoryAdmissions::default();
    let first = repo.prepare(&vaults, "main", &session).unwrap();
    let grant = repo.complete(&vaults, &first).unwrap();
    assert!(repo.leave("main", true));
    assert!(repo.check(&vaults, &grant).is_err());
    let pending = repo.prepare(&vaults, "main", &session).unwrap();
    assert!(pending.preserves_reads());
    assert_eq!(
        repo.complete(&vaults, &pending).unwrap().generation(),
        grant.generation()
    );
    repo.leave("main", false);
    let stale = repo.prepare(&vaults, "main", &session).unwrap();
    let newer = repo.prepare(&vaults, "main", &session).unwrap();
    assert!(repo.complete(&vaults, &stale).is_err());
    let newer = repo.complete(&vaults, &newer).unwrap();
    assert!(newer.generation() > grant.generation());
    assert!(repo.check(&vaults, &grant).is_err());
    assert!(repo.check(&vaults, &newer).is_ok());
}
#[test]
fn source_discovery_preserves_all_repository_bytes_and_dirty_files_in_both_git_layouts() {
    fn files(root: &Path) -> Vec<(std::path::PathBuf, Vec<u8>)> {
        fn walk(root: &Path, at: &Path, out: &mut Vec<(std::path::PathBuf, Vec<u8>)>) {
            for entry in std::fs::read_dir(at).unwrap() {
                let path = entry.unwrap().path();
                if path.is_dir() {
                    walk(root, &path, out)
                } else {
                    out.push((
                        path.strip_prefix(root).unwrap().into(),
                        std::fs::read(path).unwrap(),
                    ));
                }
            }
        }
        let mut out = Vec::new();
        walk(root, root, &mut out);
        out.sort();
        out
    }
    for colocate in [true, false] {
        let (_root, vaults, session) = fixture(colocate);
        let path = vaults.get(&session).unwrap().path();
        let before = files(path);
        let mut repo = RepositoryAdmissions::default();
        let plan = repo.prepare(&vaults, "main", &session).unwrap();
        let grant = repo.complete(&vaults, &plan).unwrap();
        repo.check(&vaults, &grant).unwrap();
        assert_eq!(files(path), before);
        assert!(
            jj_store_jj::local_repository::inspect_workspace(path)
                .unwrap()
                .repository
                .is_none()
        );
    }
}
#[test]
fn altered_source_witnesses_and_closure_fence_existing_grants() {
    let (_root, vaults, session) = fixture(true);
    let mut repo = RepositoryAdmissions::default();
    let plan = repo.prepare(&vaults, "main", &session).unwrap();
    let grant = repo.complete(&vaults, &plan).unwrap();
    let store_type = grant.metadata_path().join("store/type");
    let original = std::fs::read(&store_type).unwrap();
    std::fs::write(&store_type, b"other").unwrap();
    assert!(repo.check(&vaults, &grant).is_err());
    std::fs::write(&store_type, original).unwrap();
    assert!(repo.check(&vaults, &grant).is_err());
    let pending = repo.prepare(&vaults, "main", &session).unwrap();
    let current = repo.complete(&vaults, &pending).unwrap();
    let retired = repo.begin_close_vault(&session);
    assert_eq!(retired.len(), 1);
    assert_eq!(repo.begin_close_vault(&session), retired);
    assert!(repo.check(&vaults, &current).is_err());
    assert!(repo.prepare(&vaults, "main", &session).is_err());
    repo.finish_close_vault(&session);
    let pending = repo.prepare(&vaults, "main", &session).unwrap();
    assert!(repo.complete(&vaults, &pending).is_ok());
}

#[test]
fn linked_workspaces_and_external_heads_keep_exact_physical_bindings() {
    let (root, mut vaults, session) = fixture(false);
    let source = vaults.get(&session).unwrap().path().to_path_buf();
    let linked = root.path().join("Linked vault");
    jj(&source, &["workspace", "add", linked.to_str().unwrap()]);
    let linked_session = vaults
        .select(Some(linked), None)
        .unwrap()
        .unwrap()
        .session_id;
    let mut repo = RepositoryAdmissions::default();
    let plan = repo.prepare(&vaults, "main", &linked_session).unwrap();
    let grant = repo.complete(&vaults, &plan).unwrap();
    assert_eq!(grant.metadata_path(), source.join(".jj/repo"));
    jj(&source, &["describe", "-m", "external operation"]);
    repo.check(&vaults, &grant).unwrap();
    // A link rewrite in place cannot reuse its old directory witnesses.
    let link = vaults.get(&linked_session).unwrap().path().join(".jj/repo");
    std::fs::write(&link, b"/outside\n").unwrap();
    assert!(repo.check(&vaults, &grant).is_err());
}

#[test]
fn replacing_vault_jj_metadata_or_git_directory_never_restores_a_retired_grant() {
    for component in ["vault", "jj", "metadata", "git"] {
        let (root, vaults, session) = fixture(true);
        let mut repo = RepositoryAdmissions::default();
        let plan = repo.prepare(&vaults, "main", &session).unwrap();
        let grant = repo.complete(&vaults, &plan).unwrap();
        let vault = vaults.get(&session).unwrap().path();
        let path = match component {
            "vault" => vault.to_path_buf(),
            "jj" => vault.join(".jj"),
            "metadata" => grant.metadata_path().to_path_buf(),
            _ => vault.join(".git"),
        };
        let old = root.path().join("retained original");
        std::fs::rename(&path, &old).unwrap();
        std::fs::create_dir(&path).unwrap();
        assert!(repo.check(&vaults, &grant).is_err(), "{component}");
        std::fs::remove_dir(&path).unwrap();
        std::fs::rename(&old, &path).unwrap();
        assert!(repo.check(&vaults, &grant).is_err(), "{component}");
    }
}

#[test]
fn changed_or_symlinked_witnesses_reject_before_completion() {
    use std::os::unix::fs::symlink;
    let (root, vaults, session) = fixture(false);
    let mut repo = RepositoryAdmissions::default();
    let plan = repo.prepare(&vaults, "main", &session).unwrap();
    let path = vaults
        .get(&session)
        .unwrap()
        .path()
        .join(".jj/repo/store/git_target");
    let original = root.path().join("retained target");
    std::fs::rename(&path, &original).unwrap();
    symlink(&original, &path).unwrap();
    assert!(repo.complete(&vaults, &plan).is_err());
    assert!(repo.authorize(&vaults, "main", &session).is_err());
    assert!(repo.prepare(&vaults, "main", &session).is_err());
}
