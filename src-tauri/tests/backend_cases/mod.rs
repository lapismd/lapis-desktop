mod ownership;
mod persistence;
mod process;
mod sources;
use cap_std::{ambient_authority, fs::Dir};
use lapis_desktop::{
    ai::backend::{Admission, BackendProfiles},
    vault::{VaultManager, admission::VaultAdmissions},
};
use std::{
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
pub struct Fixture {
    pub root: tempfile::TempDir,
    pub vault: PathBuf,
    pub profile: PathBuf,
    pub state: Arc<Mutex<(VaultManager, VaultAdmissions)>>,
}
impl Fixture {
    pub fn new() -> Self {
        let root = tempfile::tempdir().unwrap();
        let vault = root.path().join("Vault 笔记");
        let profile = root.path().join("profile");
        std::fs::create_dir(&vault).unwrap();
        let mut vaults = VaultManager::new(&profile).unwrap();
        let session = vaults
            .select(Some(vault.clone()), None)
            .unwrap()
            .unwrap()
            .session_id;
        let mut ai = VaultAdmissions::default();
        let plan = ai.prepare(&vaults, "main", &session).unwrap();
        ai.complete(&vaults, &plan).unwrap();
        Self {
            root,
            vault,
            profile,
            state: Arc::new(Mutex::new((vaults, ai))),
        }
    }
    pub fn admission(&self) -> Admission {
        let state = self.state.clone();
        Arc::new(move || {
            let mut state = state.lock().unwrap();
            let (vaults, ai) = &mut *state;
            ai.authorize(vaults, "main").map_err(|e| e.error)
        })
    }
    pub fn open(&self) -> BackendProfiles {
        BackendProfiles::new(
            Dir::open_ambient_dir(&self.profile, ambient_authority()).unwrap(),
            self.admission(),
        )
        .unwrap()
    }
    pub fn config(&self) -> PathBuf {
        std::fs::read_dir(self.profile.join("ai-backends-v1"))
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path()
    }
}
pub fn run<T>(future: impl std::future::Future<Output = T>) -> T {
    tauri::async_runtime::block_on(future)
}
pub fn jj(path: &Path, args: &[&str]) -> String {
    let mut command = std::process::Command::new(
        std::env::var_os("JJ_STORE_TEST_STOCK_JJ").unwrap_or_else(|| "/opt/homebrew/bin/jj".into()),
    );
    command.current_dir(path).args([
        "--no-pager",
        "--config",
        "user.name='Fixture'",
        "--config",
        "user.email='fixture@invalid'",
    ]);
    if args.first() == Some(&"op") {
        command.arg("--ignore-working-copy");
    }
    let output = command
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
