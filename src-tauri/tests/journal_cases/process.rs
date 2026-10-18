use super::*;
use std::{
    io::{BufRead, Write},
    process::{Command, Stdio},
};
struct Child(std::process::Child);
impl Drop for Child {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[test]
fn exclusive_journal_reopens_original_candidate_after_a_cold_process_exits() {
    const CHILD: &str = "LAPIS_DESKTOP_CAPTURE_JOURNAL_CHILD";
    if let Some(path) = std::env::var_os(CHILD) {
        let journal = open(Path::new(&path));
        let c = candidate(1);
        assert!(matches!(run(journal.begin(&c)).unwrap(), Claim::New));
        println!("journal-lease-held");
        std::io::stdout().flush().unwrap();
        let mut line = String::new();
        std::io::stdin().read_line(&mut line).unwrap();
        assert_eq!(line, "release\n");
        drop(journal);
        return;
    }
    let root = tempfile::tempdir().unwrap();
    let mut child=Child(Command::new(std::env::current_exe().unwrap()).args(["--exact","journal_cases::process::exclusive_journal_reopens_original_candidate_after_a_cold_process_exits","--nocapture"]).env(CHILD,root.path()).stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().unwrap());
    let mut output = std::io::BufReader::new(child.0.stdout.take().unwrap());
    loop {
        let mut line = String::new();
        assert!(
            output.read_line(&mut line).unwrap() > 0,
            "child must retain its lease"
        );
        if line.trim() == "journal-lease-held" {
            break;
        }
    }
    let profile = Dir::open_ambient_dir(root.path(), ambient_authority()).unwrap();
    let c = candidate(1);
    assert!(
        ProfileJournal::open(
            &profile,
            c.context.clone(),
            &provider(&c.context),
            Arc::new(|| Ok(()))
        )
        .is_err()
    );
    child
        .0
        .stdin
        .take()
        .unwrap()
        .write_all(b"release\n")
        .unwrap();
    assert!(child.0.wait().unwrap().success());
    let journal = open(root.path());
    let Claim::Existing(entry) = run(journal.begin(&c)).unwrap() else {
        panic!("original intent")
    };
    assert_eq!(entry.candidate, c);
    assert!(entry.prepared.is_none());
    assert!(entry.confirmation.is_none());
}
