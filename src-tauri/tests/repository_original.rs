use jj_store_jj::vault_workspace::Session;
use jj_vault::Binding;
use lapis_desktop::{repository::RepositoryAdmissions, vault::VaultManager};
use std::{fs, path::Path, process::Command};
fn stock(root: &Path, args: &[&str]) {
    let result = Command::new("/opt/homebrew/bin/jj")
        .current_dir(root)
        .args([
            "--no-pager",
            "--config",
            "user.name='History fixture'",
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
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
}
#[test]
fn original_read_tokens_coexist_with_managed_backup_and_never_authorize_file_writers() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let temp = tempfile::tempdir().unwrap();
            let root = temp.path().canonicalize().unwrap();
            let notes = root.join("notes");
            fs::create_dir(&notes).unwrap();
            stock(&notes, &["git", "init", "--no-colocate", "."]);
            fs::write(notes.join("Note.md"), "Original recorded note\n").unwrap();
            stock(&notes, &["describe", "-m", "Original history"]);
            let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
            let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
            let mut admissions = RepositoryAdmissions::default();
            let plan = admissions
                .prepare_original(&vaults, "main", &vault.session_id)
                .unwrap();
            let token = plan.read_token().unwrap().to_owned();
            let original = admissions.complete(&vaults, &plan).unwrap();
            assert!(
                vaults.get(&token).is_err(),
                "read token cannot select a vault for a writer"
            );
            assert!(admissions.authorize(&vaults, "other", &token).is_err());
            assert_eq!(
                admissions.authorize(&vaults, "main", &token).unwrap(),
                original
            );
            let binding = Binding {
                vault_id: vault.profile_id,
                root: notes.clone(),
                state: root.join("private/history"),
            };
            let mut native = Session::open(binding.clone()).await.unwrap();
            native.capture(&[], "Managed backup").await.unwrap();
            drop(native);
            admissions
                .bind_backup(&vaults, &vault.session_id, &binding.state)
                .unwrap();
            let plan = admissions
                .prepare(&vaults, "main", &vault.session_id)
                .unwrap();
            assert!(plan.preserves_vault());
            assert!(
                !plan.had_prior_scope(),
                "first backup admission must not revoke the original scope"
            );
            let backup = admissions.complete(&vaults, &plan).unwrap();
            assert_ne!(backup.repository(), original.repository());
            assert_ne!(backup.metadata_path(), original.metadata_path());
            admissions.check(&vaults, &original).unwrap();
            admissions.check(&vaults, &backup).unwrap();
            fs::write(notes.join("Note.md"), "Later disk edit\n").unwrap();
            admissions.check(&vaults, &original).unwrap();
            assert_eq!(
                fs::read_to_string(notes.join("Note.md")).unwrap(),
                "Later disk edit\n"
            );
            // Reject a replaced original before changing the shared vault
            // lease; independent managed reads must remain admitted.
            fs::rename(notes.join(".jj"), root.join("previous-original")).unwrap();
            stock(&notes, &["git", "init", "--no-colocate", "."]);
            assert!(
                admissions
                    .prepare_original(&vaults, "main", &vault.session_id)
                    .is_err()
            );
            admissions.check(&vaults, &backup).unwrap();
            assert!(admissions.check(&vaults, &original).is_err());
            admissions.begin_close_vault(&vault.session_id);
            assert!(admissions.check(&vaults, &original).is_err());
            assert!(admissions.authorize(&vaults, "main", &token).is_err());
        });
}
#[test]
fn reload_rotates_original_tokens_and_metadata_replacement_requires_a_new_scope() {
    let temp = tempfile::tempdir().unwrap();
    let root = temp.path().canonicalize().unwrap();
    let notes = root.join("notes");
    fs::create_dir(&notes).unwrap();
    stock(&notes, &["git", "init", "--no-colocate", "."]);
    let mut vaults = VaultManager::new(&root.join("profile")).unwrap();
    let vault = vaults.select(Some(notes.clone()), None).unwrap().unwrap();
    let mut admissions = RepositoryAdmissions::default();
    let plan = admissions
        .prepare_original(&vaults, "main", &vault.session_id)
        .unwrap();
    let old_token = plan.read_token().unwrap().to_owned();
    let original = admissions.complete(&vaults, &plan).unwrap();
    admissions.leave("main", true);
    assert!(admissions.authorize(&vaults, "main", &old_token).is_err());
    let plan = admissions
        .prepare_original(&vaults, "main", &vault.session_id)
        .unwrap();
    assert_ne!(plan.read_token(), Some(old_token.as_str()));
    let next = admissions.complete(&vaults, &plan).unwrap();
    assert_ne!(original.generation(), next.generation());
    let saved = root.join("old-metadata");
    fs::rename(notes.join(".jj"), &saved).unwrap();
    stock(&notes, &["git", "init", "--no-colocate", "."]);
    assert!(admissions.check(&vaults, &next).is_err());
    assert!(
        admissions
            .prepare_original(&vaults, "main", &vault.session_id)
            .is_err()
    );
    admissions.leave("main", true);
    let plan = admissions
        .prepare_original(&vaults, "main", &vault.session_id)
        .unwrap();
    let replacement = admissions.complete(&vaults, &plan).unwrap();
    assert!(admissions.check(&vaults, &next).is_err());
    admissions.check(&vaults, &replacement).unwrap();
}
