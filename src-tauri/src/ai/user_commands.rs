use crate::vault::staged::StagedFile;
use cap_std::{ambient_authority, fs::Dir};
use serde::Serialize;
use std::{
    ffi::OsStr,
    io::{self, Read, Write},
    path::PathBuf,
};

pub const MAX_COMMAND_BYTES: usize = 512 * 1024;
const MAX_FILES: usize = 256;
const MAX_LIST_BYTES: usize = 8 * 1024 * 1024;
const DIRECTORY: &str = ".lapis/agents/commands";

#[derive(Debug, Serialize)]
pub struct CommandFile {
    pub name: String,
    pub content: String,
}
#[derive(Debug, Serialize)]
pub struct CommandFiles {
    pub root: PathBuf,
    pub files: Vec<CommandFile>,
}

/// Native policy supplies home; renderer requests contain command names only.
pub struct UserCommands {
    home: PathBuf,
}
impl UserCommands {
    pub fn new(home: PathBuf) -> Self {
        Self { home }
    }
    fn directory(&self, create: bool) -> io::Result<Option<Dir>> {
        let home = Dir::open_ambient_dir(&self.home, ambient_authority())?;
        if create {
            home.create_dir_all(DIRECTORY)?;
        }
        match home.open_dir(DIRECTORY) {
            Ok(directory) => Ok(Some(directory)),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
            Err(error) => Err(error),
        }
    }
    pub fn list(&self) -> io::Result<CommandFiles> {
        let mut result = CommandFiles {
            root: self.home.join(DIRECTORY),
            files: vec![],
        };
        let Some(directory) = self.directory(false)? else {
            return Ok(result);
        };
        let mut total = 0;
        for entry in directory.entries()? {
            let entry = entry?;
            let filename = entry.file_name();
            let Some(name) = filename
                .to_str()
                .and_then(|value| value.strip_suffix(".md"))
            else {
                continue;
            };
            if !valid_name(name) || !entry.file_type()?.is_file() {
                continue;
            }
            if result.files.len() >= MAX_FILES {
                return Err(invalid("Too many user command files"));
            }
            let file = directory.open(&filename)?;
            if file.metadata()?.len() > MAX_COMMAND_BYTES as u64 {
                return Err(invalid("User command file exceeds 512 KiB"));
            }
            let mut bytes = vec![];
            file.take(MAX_COMMAND_BYTES as u64 + 1)
                .read_to_end(&mut bytes)?;
            if bytes.len() > MAX_COMMAND_BYTES {
                return Err(invalid("User command file exceeds 512 KiB"));
            }
            total += bytes.len();
            if total > MAX_LIST_BYTES {
                return Err(invalid("User command inventory exceeds 8 MiB"));
            }
            let content =
                String::from_utf8(bytes).map_err(|_| invalid("User command file is not UTF-8"))?;
            result.files.push(CommandFile {
                name: name.into(),
                content,
            });
        }
        result.files.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(result)
    }
    pub fn exists(&self, name: &str) -> io::Result<bool> {
        let filename = filename(name)?;
        let Some(directory) = self.directory(false)? else {
            return Ok(false);
        };
        match directory.symlink_metadata(filename) {
            Ok(_) => Ok(true),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(false),
            Err(error) => Err(error),
        }
    }
    pub fn write(&self, name: &str, content: &str) -> io::Result<()> {
        self.save(name, content, false).map(|_| ())
    }
    pub fn create_if_missing(&self, name: &str, content: &str) -> io::Result<bool> {
        self.save(name, content, true)
    }
    fn save(&self, name: &str, content: &str, create_only: bool) -> io::Result<bool> {
        let filename = filename(name)?;
        if content.len() > MAX_COMMAND_BYTES {
            return Err(invalid("User command file exceeds 512 KiB"));
        }
        let directory = self
            .directory(true)?
            .ok_or_else(|| invalid("User command directory unavailable"))?;
        let original = match directory.symlink_metadata(&filename) {
            Ok(_) if create_only => return Ok(false),
            Ok(metadata) if !metadata.is_file() => {
                return Err(invalid("User command must be a regular file"));
            }
            Ok(metadata) if metadata.permissions().readonly() => {
                return Err(io::Error::new(
                    io::ErrorKind::PermissionDenied,
                    "User command is read-only",
                ));
            }
            Ok(metadata) => Some(metadata.permissions()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => None,
            Err(error) => return Err(error),
        };
        let mut staged = StagedFile::new(&directory)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            staged.file.set_permissions(original.unwrap_or_else(|| {
                cap_std::fs::Permissions::from_std(std::fs::Permissions::from_mode(0o600))
            }))?;
        }
        #[cfg(not(unix))]
        if let Some(permissions) = original {
            staged.file.set_permissions(permissions)?;
        }
        staged.file.write_all(content.as_bytes())?;
        staged.file.sync_all()?;
        if create_only {
            match staged.publish(OsStr::new(&filename)) {
                Ok(()) => {}
                Err(error) if error.kind() == io::ErrorKind::AlreadyExists => return Ok(false),
                Err(error) => return Err(error),
            }
        } else {
            staged.replace(OsStr::new(&filename))?;
        }
        directory.into_std_file().sync_all()?;
        Ok(true)
    }
}
fn filename(name: &str) -> io::Result<String> {
    if !valid_name(name) {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Invalid slash command name",
        ));
    }
    Ok(format!("{name}.md"))
}
fn valid_name(name: &str) -> bool {
    // Public @lapis-notes/api/agent-skills grammar: /^[a-z][a-z0-9_-]{0,63}$/.
    let bytes = name.as_bytes();
    (1..=64).contains(&bytes.len())
        && bytes[0].is_ascii_lowercase()
        && bytes.iter().all(|byte| {
            byte.is_ascii_lowercase() || byte.is_ascii_digit() || matches!(byte, b'_' | b'-')
        })
}
fn invalid(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, message)
}
