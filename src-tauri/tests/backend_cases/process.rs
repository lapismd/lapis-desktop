use super::*;
use jj_store_model::RequestId;
use lapis_desktop::ai::backend::Backend;
use std::{
    io::{BufRead, Write},
    process::{Child, Command, Stdio},
};
struct ChildOwner(Child);
impl Drop for ChildOwner {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}
#[test]
fn cold_owner_pins_backend_and_original_choice_receipt() {
    const CHILD: &str = "LAPIS_BACKEND_PROFILE_CHILD";
    if let Some(root) = std::env::var_os(CHILD) {
        let profile = PathBuf::from(root).join("profile");
        let mut vaults = VaultManager::new(&profile).unwrap();
        let id = vaults.recents()[0].id.clone();
        let session = vaults.open_recent(&id).unwrap().session_id;
        let mut ai = VaultAdmissions::default();
        let plan = ai.prepare(&vaults, "main", &session).unwrap();
        ai.complete(&vaults, &plan).unwrap();
        let state = Mutex::new((vaults, ai));
        let p = BackendProfiles::new(
            Dir::open_ambient_dir(profile, ambient_authority()).unwrap(),
            Arc::new(move || {
                let mut s = state.lock().unwrap();
                let (v, a) = &mut *s;
                a.authorize(v, "main").map_err(|e| e.error)
            }),
        )
        .unwrap();
        assert_eq!(
            p.status(RequestId::new([1; 16]))
                .unwrap()
                .unwrap()
                .selection
                .revision,
            1
        );
        let scope = p.open_scope().unwrap();
        assert_eq!(scope.selection().revision, 1);
        println!("backend-held");
        std::io::stdout().flush().unwrap();
        let mut line = String::new();
        std::io::stdin().read_line(&mut line).unwrap();
        assert_eq!(line, "release\n");
        return;
    }
    let f = Fixture::new();
    let p = f.open();
    let receipt = p
        .select(RequestId::new([1; 16]), 0, Backend::VaultFiles)
        .unwrap();
    let mut child = ChildOwner(
        Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "backend_cases::process::cold_owner_pins_backend_and_original_choice_receipt",
                "--nocapture",
            ])
            .env(CHILD, f.root.path())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .unwrap(),
    );
    let mut output = std::io::BufReader::new(child.0.stdout.take().unwrap());
    loop {
        let mut line = String::new();
        assert!(output.read_line(&mut line).unwrap() > 0);
        if line.trim() == "backend-held" {
            break;
        }
    }
    assert!(
        p.select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
            .is_err()
    );
    assert_eq!(p.status(receipt.request_id).unwrap(), Some(receipt));
    child
        .0
        .stdin
        .take()
        .unwrap()
        .write_all(b"release\n")
        .unwrap();
    assert!(child.0.wait().unwrap().success());
    assert_eq!(
        p.select(RequestId::new([2; 16]), 1, Backend::VaultFiles)
            .unwrap()
            .selection
            .revision,
        2
    );
}
