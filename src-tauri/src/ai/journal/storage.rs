use cap_std::fs::{Dir, MetadataExt as _};
use rustix::fs::{Mode, OFlags};
use std::{
    fs::File,
    io::{self, Read},
    os::unix::fs::MetadataExt as _,
};

pub(super) fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Private capture journal is unavailable",
    )
}
pub(super) fn directory(parent: &Dir, name: &str) -> io::Result<Dir> {
    match rustix::fs::mkdirat(parent, name, Mode::RWXU) {
        Ok(()) => {
            parent.try_clone()?.into_std_file().sync_all()?;
        }
        Err(rustix::io::Errno::EXIST) => {}
        Err(error) => return Err(error.into()),
    }
    let file = File::from(rustix::fs::openat(
        parent,
        name,
        OFlags::RDONLY | OFlags::DIRECTORY | OFlags::NOFOLLOW | OFlags::CLOEXEC,
        Mode::empty(),
    )?);
    let metadata = file.metadata()?;
    if metadata.uid() != parent.dir_metadata()?.uid() || metadata.mode() & 0o077 != 0 {
        return Err(denied());
    }
    Ok(Dir::from_std_file(file))
}
pub(super) fn file(parent: &Dir, name: &str, create: bool) -> io::Result<File> {
    let flags = if create {
        OFlags::RDWR | OFlags::CREATE
    } else {
        OFlags::RDONLY
    };
    let file = File::from(rustix::fs::openat(
        parent,
        name,
        flags | OFlags::NOFOLLOW | OFlags::NONBLOCK | OFlags::CLOEXEC,
        Mode::RUSR | Mode::WUSR,
    )?);
    let m = file.metadata()?;
    if !m.is_file()
        || m.nlink() != 1
        || m.uid() != parent.dir_metadata()?.uid()
        || m.mode() & 0o077 != 0
    {
        return Err(denied());
    }
    Ok(file)
}
pub(super) fn read(parent: &Dir, name: &str, limit: usize) -> io::Result<Option<Vec<u8>>> {
    let file = match file(parent, name, false) {
        Ok(file) => file,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error),
    };
    if file.metadata()?.len() > limit as u64 {
        return Err(denied());
    }
    let mut bytes = Vec::new();
    file.take(limit as u64 + 1).read_to_end(&mut bytes)?;
    if bytes.len() > limit {
        return Err(denied());
    }
    Ok(Some(bytes))
}
pub(super) fn write(parent: &Dir, name: &str, bytes: &[u8], exclusive: bool) -> io::Result<()> {
    use std::{ffi::OsStr, io::Write, os::unix::fs::PermissionsExt};
    let mut staged = crate::vault::staged::StagedFile::new(parent)?;
    staged
        .file
        .set_permissions(cap_std::fs::Permissions::from_std(
            std::fs::Permissions::from_mode(0o600),
        ))?;
    staged.file.write_all(bytes)?;
    staged.file.sync_all()?;
    if exclusive {
        staged.publish(OsStr::new(name))?;
    } else {
        staged.replace(OsStr::new(name))?;
    }
    parent.try_clone()?.into_std_file().sync_all()
}
