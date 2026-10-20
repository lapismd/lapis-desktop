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
    /// AI resolves its own admitted vault identity; no History grant is reused.
    pub fn managed(binding: &jj_vault::Binding) -> io::Result<Self> {
        binding.validate().map_err(|_| super::denied())?;
        let source = Self::external(&binding.root, &binding.state)?;
        let record = source
            .witnesses
            .iter()
            .find(|w| w.path == binding.state.join("vault.json"))
            .and_then(|w| w.contents.as_deref())
            .ok_or_else(super::denied)?;
        let record: serde_json::Value = serde_json::from_slice(record)?;
        let identity = std::fs::symlink_metadata(&binding.root)?;
        let root_identity = format!("{}:{}", identity.dev(), identity.ino());
        if record["binding"]["vault_id"].as_str() != Some(binding.vault_id.as_str())
            || record["root_identity"].as_str() != Some(root_identity.as_str())
        {
            return Err(super::denied());
        }
        source.verify()?;
        Ok(source)
    }
    /// Both paths come from the admitted native backup owner, never a read frame.
    pub fn external(root: &Path, state: &Path) -> io::Result<Self> {
        let metadata = state.join("repo");
        let manifest = Witness::capture(state.join("vault.json"), false)?;
        let record: serde_json::Value =
            serde_json::from_slice(manifest.contents.as_deref().ok_or_else(super::denied)?)?;
        if record["version"].as_u64() != Some(1)
            || record["binding"]["root"].as_str() != root.to_str()
            || record["binding"]["state"].as_str() != state.to_str()
        {
            return Err(super::denied());
        }
        let mut witnesses = Vec::new();
        for path in [
            root.to_path_buf(),
            state.to_path_buf(),
            metadata.clone(),
            state.join("working_copy"),
            metadata.join("store"),
            metadata.join("store/git"),
        ] {
            witnesses.push(Witness::capture(path, true)?);
        }
        witnesses.push(manifest);
        for path in [
            state.join("working_copy/type"),
            metadata.join("store/type"),
            metadata.join("store/git_target"),
        ] {
            witnesses.push(Witness::capture(path, false)?);
        }
        let source = Self {
            metadata,
            witnesses,
        };
        source.verify()?;
        Ok(source)
    }
    pub fn fingerprint(&self) -> [u8; 32] {
        use sha2::{Digest, Sha256};
        use std::os::unix::ffi::OsStrExt;
        let mut hash = Sha256::new_with_prefix(b"lapis-desktop/repository-binding/v1\0");
        for w in &self.witnesses {
            let path = w.path.as_os_str().as_bytes();
            hash.update((path.len() as u64).to_be_bytes());
            hash.update(path);
            hash.update(w.identity.0.to_be_bytes());
            hash.update(w.identity.1.to_be_bytes());
            hash.update([u8::from(w.directory)]);
            let data = w.contents.as_deref().unwrap_or_default();
            hash.update((data.len() as u64).to_be_bytes());
            hash.update(data);
        }
        hash.finalize().into()
    }
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
