use lapis_app_core::vault::{VaultRoot, WriteOptions};
use std::fs;
use std::io::{self, BufRead, Read, Write};
use std::process::{Command, Stdio};
use tempfile::tempdir;

#[test]
fn killing_a_writer_during_staging_preserves_the_previous_complete_note() {
    let root = tempdir().unwrap();
    fs::write(root.path().join("note.md"), b"previous complete note").unwrap();
    let mut child = Command::new(std::env::current_exe().unwrap())
        .args([
            "--ignored",
            "--exact",
            "staging_process_helper",
            "--nocapture",
        ])
        .env("LAPIS_WRITE_CRASH_ROOT", root.path())
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    let stdout = child.stdout.take().unwrap();
    let mut lines = io::BufReader::new(stdout).lines();
    let mut staged = false;
    for line in lines.by_ref() {
        if line.unwrap().contains("STAGING_READY") {
            staged = true;
            break;
        }
    }
    if !staged {
        let _ = child.kill();
    }
    assert!(
        staged,
        "Child must reach a real partially written staging file"
    );
    child.kill().unwrap();
    assert!(!child.wait().unwrap().success());
    let reopened = VaultRoot::open(root.path()).unwrap();
    assert_eq!(
        reopened.read_text("note.md").unwrap(),
        "previous complete note"
    );
}

#[test]
#[ignore = "subprocess helper invoked by the interruption test"]
fn staging_process_helper() {
    struct SlowSource(bool);
    impl Read for SlowSource {
        fn read(&mut self, bytes: &mut [u8]) -> io::Result<usize> {
            if !self.0 {
                self.0 = true;
                bytes[..4].copy_from_slice(b"half");
                return Ok(4);
            }
            println!("STAGING_READY");
            io::stdout().flush()?;
            io::stdin().read(&mut [0])?;
            Err(io::Error::other("interrupted source"))
        }
    }
    let root = std::env::var_os("LAPIS_WRITE_CRASH_ROOT").unwrap();
    let vault = VaultRoot::open(std::path::Path::new(&root)).unwrap();
    let _ = vault.write_from("note.md", SlowSource(false), &WriteOptions::default());
}

#[cfg(unix)]
#[test]
fn concurrent_symlink_substitution_never_reads_or_writes_outside_the_admitted_root() {
    use std::os::unix::fs::symlink;
    let root = tempdir().unwrap();
    let outside = tempdir().unwrap();
    fs::create_dir(root.path().join("live")).unwrap();
    fs::write(root.path().join("live/secret"), b"inside").unwrap();
    fs::write(outside.path().join("secret"), b"outside").unwrap();
    let vault = VaultRoot::open(root.path()).unwrap();
    let toggled_root = root.path().to_owned();
    let external = outside.path().to_owned();
    let swapper = std::thread::spawn(move || {
        for _ in 0..200 {
            fs::rename(toggled_root.join("live"), toggled_root.join("parked")).unwrap();
            symlink(&external, toggled_root.join("live")).unwrap();
            std::thread::yield_now();
            fs::remove_file(toggled_root.join("live")).unwrap();
            fs::rename(toggled_root.join("parked"), toggled_root.join("live")).unwrap();
        }
    });
    for _ in 0..400 {
        if let Ok(bytes) = vault.read("live/secret") {
            assert_eq!(bytes, b"inside");
        }
        let _ = vault.write("live/note.md", b"inside write", &WriteOptions::default());
    }
    swapper.join().unwrap();
    assert_eq!(fs::read(outside.path().join("secret")).unwrap(), b"outside");
    assert!(!outside.path().join("note.md").exists());
}

#[cfg(unix)]
#[test]
fn create_cannot_admit_a_symlink_substituted_outside_its_selected_parent() {
    use lapis_desktop::vault::VaultManager;
    use std::os::unix::fs::symlink;
    use std::sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    };
    let profile = tempdir().unwrap();
    let parent = tempdir().unwrap();
    let outside = tempdir().unwrap();
    fs::write(outside.path().join("outside.md"), b"outside").unwrap();
    let parent_path = parent.path().to_owned();
    let external = outside.path().to_owned();
    let stop = Arc::new(AtomicBool::new(false));
    let stopped = stop.clone();
    let swapper = std::thread::spawn(move || {
        let child = parent_path.join("child");
        while !stopped.load(Ordering::SeqCst) {
            let _ = fs::remove_file(&child);
            std::thread::sleep(std::time::Duration::from_micros(50));
            let _ = fs::remove_dir(&child);
            let _ = symlink(&external, &child);
            std::thread::sleep(std::time::Duration::from_micros(50));
            let _ = fs::remove_file(&child);
        }
    });
    let mut manager = VaultManager::new(profile.path()).unwrap();
    let mut escaped = false;
    for _ in 0..300 {
        if let Ok(Some(selected)) = manager.select(Some(parent.path().to_owned()), Some("child")) {
            escaped |= manager
                .get(&selected.session_id)
                .unwrap()
                .read("outside.md")
                .is_ok();
            manager.close(&selected.session_id).unwrap();
            if escaped {
                break;
            }
        }
    }
    stop.store(true, Ordering::SeqCst);
    swapper.join().unwrap();
    assert!(
        !escaped,
        "Create admitted a substituted directory outside the chosen parent"
    );
}
