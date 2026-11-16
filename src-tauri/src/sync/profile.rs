//! Desktop installation identity, outside vault content and disposable indexes.
use cap_std::fs::{Dir, MetadataExt};
use lapis_app_core::vault::{VaultRoot, WriteOptions};
use serde::{Deserialize, Serialize};
use std::io::{self, Read};
use uuid::Uuid;

const FILE: &str = "desktop-profile.json";
const CLAIM: &str = ".lapis-sync-profile.identity";
const MAX_BYTES: u64 = 4096;

#[derive(Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
struct Identity {
    version: u32,
    id: Uuid,
    profile_fs: [u64; 2],
    sync_fs: [u64; 2],
    claim_fs: [u64; 2],
}

/// Native host policy only. No renderer-supplied path or identity is accepted.
/// Construction is explicit and blocking; disabled Sync never calls this.
pub struct SyncProfile {
    root: VaultRoot,
    directory: Dir,
    identity: Identity,
}
impl SyncProfile {
    pub fn open(root: &VaultRoot) -> io::Result<Self> {
        root.verify_physical_root()?;
        let profile_directory = root.directory_handle()?;
        let fresh = match profile_directory.symlink_metadata(CLAIM) {
            Ok(_) => false,
            Err(error) if error.kind() == io::ErrorKind::NotFound => {
                if root.stat("sync")?.is_some() {
                    return Err(invalid());
                }
                let id = Uuid::new_v4();
                root.create_file(CLAIM, &id.as_bytes()[..], &WriteOptions::default())?;
                root.mkdir("sync", false)?;
                true
            }
            Err(error) => return Err(error),
        };
        let directory = root.open_directory("sync")?;
        #[cfg(unix)]
        {
            use cap_std::fs::PermissionsExt;
            directory.set_permissions(".", cap_std::fs::Permissions::from_mode(0o700))?;
        }
        let (id, claim_fs) = read_claim(&profile_directory)?;
        let (device, inode) = root.physical_identity()?;
        let metadata = directory.dir_metadata()?;
        let expected = Identity {
            version: 1,
            id,
            profile_fs: [device, inode],
            sync_fs: [metadata.dev(), metadata.ino()],
            claim_fs,
        };
        if fresh {
            let bytes = serde_json::to_vec(&expected).map_err(|_| invalid())?;
            root.create_file(
                "sync/desktop-profile.json",
                &bytes[..],
                &WriteOptions::default(),
            )?;
        }
        // The profile-level witness survives loss of the Sync repository.
        // Either surviving evidence forbids issuing a replacement identity.
        let identity = read_identity(&directory)?;
        if identity != expected {
            return Err(invalid());
        }
        let admitted = Self {
            root: root.try_clone()?,
            directory,
            identity,
        };
        admitted.verify()?;
        Ok(admitted)
    }

    pub fn id(&self) -> Uuid {
        self.identity.id
    }

    pub fn verify(&self) -> io::Result<()> {
        self.root.verify_physical_root()?;
        let current = self.root.open_directory("sync")?.dir_metadata()?;
        let (id, claim_fs) = read_claim(&self.root.directory_handle()?)?;
        if [current.dev(), current.ino()] != self.identity.sync_fs
            || id != self.identity.id
            || claim_fs != self.identity.claim_fs
            || read_identity(&self.directory)? != self.identity
        {
            return Err(invalid());
        }
        self.root.verify_physical_root()
    }
}

fn read_identity(directory: &Dir) -> io::Result<Identity> {
    let (bytes, _) = read(directory, FILE, MAX_BYTES)?;
    serde_json::from_slice(&bytes).map_err(|_| invalid())
}
fn read_claim(directory: &Dir) -> io::Result<(Uuid, [u64; 2])> {
    let (bytes, identity) = read(directory, CLAIM, 16)?;
    let id = Uuid::from_slice(&bytes).map_err(|_| invalid())?;
    if id.is_nil() {
        return Err(invalid());
    }
    Ok((id, identity))
}
fn read(directory: &Dir, name: &str, max: u64) -> io::Result<(Vec<u8>, [u64; 2])> {
    let expected = directory.symlink_metadata(name).map_err(|_| invalid())?;
    if !expected.is_file() || expected.file_type().is_symlink() || expected.len() > max {
        return Err(invalid());
    }
    let mut options = cap_std::fs::OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use cap_std::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NONBLOCK | libc::O_NOFOLLOW);
    }
    let file = directory.open_with(name, &options).map_err(|_| invalid())?;
    let actual = file.metadata()?;
    if !actual.is_file() || (actual.dev(), actual.ino()) != (expected.dev(), expected.ino()) {
        return Err(invalid());
    }
    let mut bytes = Vec::new();
    file.take(max + 1).read_to_end(&mut bytes)?;
    let current = directory.symlink_metadata(name)?;
    if bytes.len() as u64 > max
        || current.file_type().is_symlink()
        || (current.dev(), current.ino()) != (actual.dev(), actual.ino())
    {
        return Err(invalid());
    }
    Ok((bytes, [actual.dev(), actual.ino()]))
}

fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidData,
        "Native Sync profile identity is missing, corrupt or foreign; recovery is required",
    )
}
