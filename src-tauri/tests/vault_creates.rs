use lapis_desktop::vault::{MAX_FILE_BYTES, VaultRoot, WriteOptions};
use std::{
    fs,
    io::{self, Cursor, Read},
    sync::{Arc, Barrier},
    thread,
};
use tempfile::tempdir;

#[test]
fn exclusive_creation_preserves_unicode_binary_bytes_and_existing_destinations() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    root.create_file(
        "café.md",
        "# 笔记\n".as_bytes(),
        &WriteOptions {
            mtime: Some(1_700_000_000_000.0),
        },
    )
    .unwrap();
    assert_eq!(root.read_text("café.md").unwrap(), "# 笔记\n");
    assert_eq!(
        root.stat("café.md").unwrap().unwrap().mtime,
        1_700_000_000_000.0
    );
    assert_eq!(
        root.create_file("café.md", b"overwrite".as_slice(), &WriteOptions::default())
            .unwrap_err()
            .kind(),
        io::ErrorKind::AlreadyExists
    );
    assert_eq!(root.read_text("café.md").unwrap(), "# 笔记\n");
    let binary = [0, 255, 128, 1];
    root.create_file("附件.bin", binary.as_slice(), &WriteOptions::default())
        .unwrap();
    assert_eq!(root.read("附件.bin").unwrap(), binary);
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 2);
}
struct CompetingReader {
    bytes: Cursor<Vec<u8>>,
    barrier: Arc<Barrier>,
    started: bool,
}
impl Read for CompetingReader {
    fn read(&mut self, output: &mut [u8]) -> io::Result<usize> {
        if !self.started {
            self.started = true;
            self.barrier.wait();
        }
        self.bytes.read(output)
    }
}
#[test]
fn racing_creators_publish_only_one_complete_file() {
    let directory = tempdir().unwrap();
    let root = Arc::new(VaultRoot::open(directory.path()).unwrap());
    let barrier = Arc::new(Barrier::new(2));
    let handles: Vec<_> = [vec![7; 256 * 1024], vec![19; 256 * 1024]]
        .into_iter()
        .map(|bytes| {
            let root = root.clone();
            let barrier = barrier.clone();
            thread::spawn(move || {
                root.create_file(
                    "raced.bin",
                    CompetingReader {
                        bytes: Cursor::new(bytes),
                        barrier,
                        started: false,
                    },
                    &WriteOptions::default(),
                )
            })
        })
        .collect();
    let results: Vec<_> = handles
        .into_iter()
        .map(|handle| handle.join().unwrap())
        .collect();
    assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        results
            .iter()
            .filter_map(|result| result.as_ref().err())
            .next()
            .unwrap()
            .kind(),
        io::ErrorKind::AlreadyExists
    );
    let bytes = root.read("raced.bin").unwrap();
    assert!(bytes == vec![7; 256 * 1024] || bytes == vec![19; 256 * 1024]);
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}
struct ArrivingDestination {
    path: std::path::PathBuf,
    done: bool,
}
impl Read for ArrivingDestination {
    fn read(&mut self, output: &mut [u8]) -> io::Result<usize> {
        if self.done {
            return Ok(0);
        }
        self.done = true;
        fs::write(&self.path, b"external arrival")?;
        output[..4].copy_from_slice(b"ours");
        Ok(4)
    }
}
#[test]
fn a_destination_arriving_during_staging_is_never_replaced() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    let error = root
        .create_file(
            "new.md",
            ArrivingDestination {
                path: directory.path().join("new.md"),
                done: false,
            },
            &WriteOptions::default(),
        )
        .unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::AlreadyExists);
    assert_eq!(root.read("new.md").unwrap(), b"external arrival");
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}
#[test]
fn failed_or_oversized_creates_clean_staging_without_publishing() {
    struct Failed;
    impl Read for Failed {
        fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
            Err(io::Error::other("source failed"))
        }
    }
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    assert!(
        root.create_file("failed.md", Failed, &WriteOptions::default())
            .is_err()
    );
    assert_eq!(
        root.create_file(
            "large.bin",
            io::repeat(0).take(MAX_FILE_BYTES + 1),
            &WriteOptions::default()
        )
        .unwrap_err()
        .kind(),
        io::ErrorKind::InvalidInput
    );
    assert!(
        root.create_file(
            "bad-time.md",
            b"body".as_slice(),
            &WriteOptions {
                mtime: Some(f64::NAN)
            }
        )
        .is_err()
    );
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 0);
}
#[test]
fn exclusive_creates_reject_root_parent_and_symlink_escape() {
    let directory = tempdir().unwrap();
    let root = VaultRoot::open(directory.path()).unwrap();
    for path in [
        "",
        "/",
        "../outside",
        "/absolute",
        "a/../outside",
        "a\\outside",
    ] {
        assert!(
            root.create_file(path, b"bad".as_slice(), &WriteOptions::default())
                .is_err()
        );
    }
    #[cfg(unix)]
    {
        let outside = tempdir().unwrap();
        std::os::unix::fs::symlink(outside.path(), directory.path().join("linked")).unwrap();
        assert!(
            root.create_file(
                "linked/outside.md",
                b"bad".as_slice(),
                &WriteOptions::default()
            )
            .is_err()
        );
        assert!(!outside.path().join("outside.md").exists());
    }
}
