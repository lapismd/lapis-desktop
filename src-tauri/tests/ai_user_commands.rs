use lapis_desktop::ai::user_commands::{MAX_COMMAND_BYTES, UserCommands};
use std::{
    fs, io,
    sync::{Arc, Barrier},
};

#[test]
fn commands_are_lazy_global_markdown_files_with_exclusive_default_creation() {
    let home = tempfile::tempdir().unwrap();
    let commands = UserCommands::new(home.path().to_path_buf());
    assert!(commands.list().unwrap().files.is_empty());
    assert!(!home.path().join(".lapis").exists());
    assert!(!commands.exists("review").unwrap());
    assert!(
        commands
            .create_if_missing("review", "# Review 笔记\n")
            .unwrap()
    );
    assert!(!commands.create_if_missing("review", "replacement").unwrap());
    assert_eq!(commands.list().unwrap().files[0].content, "# Review 笔记\n");
    commands.write("review", "explicit replacement").unwrap();
    assert_eq!(
        fs::read_to_string(home.path().join(".lapis/agents/commands/review.md")).unwrap(),
        "explicit replacement"
    );
    assert!(
        UserCommands::new(home.path().to_path_buf())
            .exists("review")
            .unwrap()
    );
}

#[test]
fn only_public_slash_command_names_are_admitted() {
    let home = tempfile::tempdir().unwrap();
    let commands = UserCommands::new(home.path().to_path_buf());
    for name in [
        "",
        "../escape",
        "/absolute",
        "a/b",
        "a\\b",
        ".hidden",
        "Upper",
        "name.md",
        "a b",
        "a\0b",
        &"a".repeat(65),
    ] {
        assert!(commands.exists(name).is_err(), "{name:?}");
        assert!(commands.write(name, "blocked").is_err(), "{name:?}");
    }
    assert!(!home.path().join(".lapis").exists());
    commands.write(&"a".repeat(64), "bounded name").unwrap();
    commands.write("review_2-next", "valid").unwrap();
    assert_eq!(commands.list().unwrap().files.len(), 2);
}

#[test]
fn failed_or_oversized_writes_preserve_the_original_and_read_errors_are_visible() {
    let home = tempfile::tempdir().unwrap();
    let commands = UserCommands::new(home.path().to_path_buf());
    commands.write("review", "original").unwrap();
    assert!(
        commands
            .write("review", &"x".repeat(MAX_COMMAND_BYTES + 1))
            .is_err()
    );
    assert_eq!(commands.list().unwrap().files[0].content, "original");
    let root = home.path().join(".lapis/agents/commands");
    fs::write(root.join("broken.md"), [0xff, 0xfe]).unwrap();
    assert_eq!(
        commands.list().unwrap_err().kind(),
        io::ErrorKind::InvalidData
    );
    fs::remove_file(root.join("broken.md")).unwrap();
    fs::create_dir(root.join("folder.md")).unwrap();
    fs::write(root.join("ignored.txt"), "ignored").unwrap();
    assert_eq!(commands.list().unwrap().files.len(), 1);
    assert!(!fs::read_dir(root).unwrap().any(|entry| {
        entry
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with(".lapis-stage-")
    }));
}

#[test]
fn simultaneous_default_seeders_never_overwrite_one_another() {
    let home = tempfile::tempdir().unwrap();
    let commands = Arc::new(UserCommands::new(home.path().to_path_buf()));
    let barrier = Arc::new(Barrier::new(2));
    let handles: Vec<_> = ["first", "second"]
        .into_iter()
        .map(|content| {
            let commands = commands.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                commands.create_if_missing("help", content).unwrap()
            })
        })
        .collect();
    assert_eq!(
        handles
            .into_iter()
            .map(|handle| handle.join().unwrap())
            .filter(|created| *created)
            .count(),
        1
    );
    assert!(matches!(
        commands.list().unwrap().files[0].content.as_str(),
        "first" | "second"
    ));
}

#[cfg(unix)]
#[test]
fn links_cannot_escape_the_fixed_user_directory() {
    use std::os::unix::fs::symlink;
    let home = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();
    fs::write(outside.path().join("secret.md"), "outside").unwrap();
    let commands = UserCommands::new(home.path().to_path_buf());
    commands.write("review", "inside").unwrap();
    symlink(
        outside.path().join("secret.md"),
        home.path().join(".lapis/agents/commands/alias.md"),
    )
    .unwrap();
    assert_eq!(commands.list().unwrap().files.len(), 1);
    assert!(commands.exists("alias").unwrap());
    assert!(!commands.create_if_missing("alias", "blocked").unwrap());
    assert!(commands.write("alias", "blocked").is_err());
    assert_eq!(
        fs::read_to_string(outside.path().join("secret.md")).unwrap(),
        "outside"
    );
    let second = tempfile::tempdir().unwrap();
    symlink(outside.path(), second.path().join(".lapis")).unwrap();
    assert!(
        UserCommands::new(second.path().to_path_buf())
            .write("blocked", "no escape")
            .is_err()
    );
    assert!(!outside.path().join("agents").exists());
}
