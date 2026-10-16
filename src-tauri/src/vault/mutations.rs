use super::{VaultRoot, invalid};
use cap_std::fs::{Dir, File, OpenOptions};
use std::ffi::{OsStr, OsString};
use std::io::{self, Write};
use std::path::Path;

fn rename_exclusive(from: &Dir, source: &OsStr, to: &Dir, destination: &OsStr) -> io::Result<()> {
    #[cfg(any(
        target_os = "macos",
        target_os = "ios",
        target_os = "linux",
        target_os = "android"
    ))]
    {
        rustix::fs::renameat_with(
            from,
            source,
            to,
            destination,
            rustix::fs::RenameFlags::NOREPLACE,
        )
        .map_err(Into::into)
    }
    #[cfg(not(any(
        target_os = "macos",
        target_os = "ios",
        target_os = "linux",
        target_os = "android"
    )))]
    {
        let _ = (from, source, to, destination);
        Err(io::Error::new(
            io::ErrorKind::Unsupported,
            "Exclusive rename is unavailable on this platform",
        ))
    }
}

struct StagedCopy<'a> {
    parent: &'a Dir,
    name: String,
    file: File,
    published: bool,
}
impl Drop for StagedCopy<'_> {
    fn drop(&mut self) {
        if !self.published {
            let _ = self.parent.remove_file(&self.name);
        }
    }
}

impl VaultRoot {
    fn entry_parent(&self, path: &str) -> io::Result<(Dir, OsString)> {
        let relative = self.checked(path, false)?;
        let name = relative
            .file_name()
            .ok_or_else(|| invalid("Missing filename"))?
            .to_owned();
        let parent = relative
            .parent()
            .filter(|p| !p.as_os_str().is_empty())
            .unwrap_or(Path::new("."));
        Ok((self.dir.open_dir(parent)?, name))
    }

    pub fn rename(&self, source: &str, destination: &str) -> io::Result<()> {
        self.stat(source)?
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Rename source is missing"))?;
        let (from, old_name) = self.entry_parent(source)?;
        let (to, new_name) = self.entry_parent(destination)?;
        if source == destination {
            return Ok(());
        }
        rename_exclusive(&from, &old_name, &to, &new_name)?;
        from.into_std_file().sync_all()?;
        to.into_std_file().sync_all()
    }

    pub fn copy_file(&self, source: &str, destination: &str) -> io::Result<()> {
        let bytes = self.read(source)?;
        let permissions = self
            .dir
            .metadata(self.checked(source, false)?)?
            .permissions();
        let (parent, name) = self.entry_parent(destination)?;
        match parent.symlink_metadata(&name) {
            Ok(_) => {
                return Err(io::Error::new(
                    io::ErrorKind::AlreadyExists,
                    "Copy destination already exists",
                ));
            }
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => return Err(error),
        }
        let stage_name = format!(".lapis-stage-{}", uuid::Uuid::new_v4());
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        let file = parent.open_with(&stage_name, &options)?;
        let mut staged = StagedCopy {
            parent: &parent,
            name: stage_name,
            file,
            published: false,
        };
        staged.file.set_permissions(permissions)?;
        staged.file.write_all(&bytes)?;
        staged.file.sync_all()?;
        rename_exclusive(&parent, OsStr::new(&staged.name), &parent, &name)?;
        staged.published = true;
        drop(staged);
        parent.into_std_file().sync_all()
    }

    pub fn remove_file(&self, path: &str) -> io::Result<()> {
        if self.stat(path)?.is_some_and(|entry| entry.r#type != "file") {
            return Err(io::Error::new(
                io::ErrorKind::IsADirectory,
                "File removal requires a regular file",
            ));
        }
        let (parent, name) = self.entry_parent(path)?;
        parent.remove_file(name)?;
        parent.into_std_file().sync_all()
    }

    pub fn remove_directory(&self, path: &str, recursive: bool) -> io::Result<()> {
        if self
            .stat(path)?
            .is_some_and(|entry| entry.r#type != "folder")
        {
            return Err(io::Error::new(
                io::ErrorKind::NotADirectory,
                "Directory removal requires a folder",
            ));
        }
        let (parent, name) = self.entry_parent(path)?;
        if recursive {
            parent.remove_dir_all(name)?;
        } else {
            parent.remove_dir(name)?;
        }
        parent.into_std_file().sync_all()
    }
}
