use jj_store_jj::local_repository::{WorkspaceInfo, inspect_workspace};
use std::os::unix::fs::MetadataExt;
use std::{
    io,
    path::{Path, PathBuf},
};

#[derive(Clone, Debug, PartialEq, Eq)]
struct Witness {
    path: PathBuf,
    identity: (u64, u64),
    directory: bool,
    contents: Option<Vec<u8>>,
}
impl Witness {
    fn capture(path: PathBuf, directory: bool) -> io::Result<Self> {
        let info = std::fs::symlink_metadata(&path)?;
        if info.file_type().is_symlink()
            || info.is_dir() != directory
            || (!directory && !info.is_file())
        {
            return Err(super::denied());
        }
        let contents = if directory {
            None
        } else {
            use std::io::Read;
            if info.len() > 4096 {
                return Err(super::denied());
            }
            let mut data = Vec::new();
            std::fs::File::open(&path)?
                .take(4097)
                .read_to_end(&mut data)?;
            if data.len() > 4096 {
                return Err(super::denied());
            }
            Some(data)
        };
        let witness = Self {
            path,
            identity: (info.dev(), info.ino()),
            directory,
            contents,
        };
        let after = std::fs::symlink_metadata(&witness.path)?;
        if after.file_type().is_symlink() || (after.dev(), after.ino()) != witness.identity {
            return Err(super::denied());
        }
        Ok(witness)
    }
    fn verify(&self) -> io::Result<()> {
        if Self::capture(self.path.clone(), self.directory)? != *self {
            return Err(super::denied());
        }
        Ok(())
    }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) struct Source {
    pub metadata: PathBuf,
    witnesses: Vec<Witness>,
}
impl Source {
    pub fn capture(root: &Path) -> io::Result<Self> {
        let WorkspaceInfo {
            path,
            metadata,
            git,
            ..
        } = inspect_workspace(root).map_err(|_| super::denied())?;
        if path != root {
            return Err(super::denied());
        }
        let mut witnesses = Vec::new();
        for directory in [
            path.clone(),
            path.join(".jj"),
            path.join(".jj/working_copy"),
            metadata.clone(),
            metadata.join("store"),
            git,
        ] {
            witnesses.push(Witness::capture(directory, true)?);
        }
        let link = path.join(".jj/repo");
        witnesses.push(Witness::capture(
            link.clone(),
            std::fs::symlink_metadata(&link)?.is_dir(),
        )?);
        for name in ["type", "git_target"] {
            witnesses.push(Witness::capture(metadata.join("store").join(name), false)?);
        }
        let source = Self {
            metadata,
            witnesses,
        };
        source.verify()?;
        Ok(source)
    }
    pub fn verify(&self) -> io::Result<()> {
        for witness in &self.witnesses {
            witness.verify()?;
        }
        Ok(())
    }
}
