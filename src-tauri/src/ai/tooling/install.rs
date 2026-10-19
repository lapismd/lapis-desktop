//! Explicit bounded npm install; no shell, global tool replacement or provider login.
use super::*;
use std::process::Stdio;
use tokio::process::{Child, Command};
pub(super) struct Process(pub(super) Child);
impl Drop for Process {
    fn drop(&mut self) {
        if let Some(pid) = self
            .0
            .id()
            .and_then(|p| rustix::process::Pid::from_raw(p as i32))
        {
            let _ = rustix::process::kill_process_group(pid, rustix::process::Signal::KILL);
        }
        let _ = self.0.start_kill();
    }
}
fn command(node: &Path, npm: &Path, stage: &Path, paths: &[PathBuf]) -> io::Result<Command> {
    let mut cmd = Command::new(node);
    // npm's resolved CLI is passed to Node, so a GUI process needs no shell PATH setup.
    cmd.arg(
        npm.canonicalize()
            .map_err(|_| io::Error::other("npm unavailable"))?,
    )
    .args([
        "install",
        "--global",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--fetch-retries=0",
        "--fetch-timeout=30000",
        "--registry=https://registry.npmjs.org",
    ])
    .arg("--prefix")
    .arg(stage)
    .arg("--cache")
    .arg(stage.join("cache"))
    .arg("--userconfig")
    .arg(stage.join("user.npmrc"))
    .arg("--globalconfig")
    .arg(stage.join("global.npmrc"))
    .arg(format!("@agentclientprotocol/codex-acp@{ADAPTER_VERSION}"))
    .arg(format!("@openai/codex@{CODEX_VERSION}"))
    .env_clear()
    .env(
        "PATH",
        std::env::join_paths(paths).map_err(|_| io::Error::other("npm unavailable"))?,
    )
    .env("HOME", stage.join("home"))
    .env("TMPDIR", stage.join("tmp"))
    .current_dir(stage)
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .kill_on_drop(true);
    #[cfg(unix)]
    cmd.process_group(0);
    Ok(cmd)
}
fn size(root: &Path) -> std::io::Result<u64> {
    let mut pending = vec![root.to_owned()];
    let mut bytes = 0;
    let mut entries = 0;
    while let Some(directory) = pending.pop() {
        for entry in fs::read_dir(directory)? {
            let entry = entry?;
            let metadata = fs::symlink_metadata(entry.path())?;
            entries += 1;
            if entries > 50000 {
                return Ok(u64::MAX);
            }
            if metadata.is_dir() {
                pending.push(entry.path());
            } else if metadata.is_file() {
                bytes += metadata.len();
            }
            if bytes > 512 * 1024 * 1024 {
                return Ok(bytes);
            }
        }
    }
    Ok(bytes)
}
fn sync_tree(root: &Path) -> std::io::Result<()> {
    let mut pending = vec![root.to_owned()];
    while let Some(directory) = pending.pop() {
        for entry in fs::read_dir(&directory)? {
            let entry = entry?;
            let metadata = fs::symlink_metadata(entry.path())?;
            if metadata.is_dir() {
                pending.push(entry.path());
            } else if metadata.is_file() {
                fs::File::open(entry.path())?.sync_all()?;
            }
        }
        fs::File::open(directory)?.sync_all()?;
    }
    Ok(())
}
pub(super) async fn prepare(
    root: &Path,
    request: RequestId,
    node: &Path,
    npm: &Path,
    paths: &[PathBuf],
) -> std::result::Result<(), &'static str> {
    let stage = paths::prefix(root, request);
    private_directory(&root.join("tooling")).map_err(|_| "runtime_directory_unavailable")?;
    // Never reuse staging, even for a duplicate or an interrupted request.
    fs::create_dir(&stage).map_err(|_| "runtime_staging_unavailable")?;
    private_directory(&stage).map_err(|_| "runtime_directory_unavailable")?;
    for name in ["home", "tmp"] {
        private_directory(&stage.join(name)).map_err(|_| "runtime_directory_unavailable")?;
    }
    for name in ["user.npmrc", "global.npmrc"] {
        fs::write(stage.join(name), "").map_err(|_| "runtime_directory_unavailable")?;
    }
    let mut cmd = command(node, npm, &stage, paths).map_err(|_| "npm_unavailable")?;
    let mut process = Process(cmd.spawn().map_err(|_| "npm_unavailable")?);
    let result = tokio::time::timeout(Duration::from_secs(120), async {
        loop {
            if let Some(exit) = process.0.try_wait().map_err(|_| "runtime_install_failed")? {
                break if exit.success() {
                    Ok(())
                } else {
                    Err("Installation failed. Check access to registry.npmjs.org, then try again.")
                };
            }
            let scan = stage.clone();
            if tokio::task::spawn_blocking(move || size(&scan))
                .await
                .map_err(|_| "runtime_staging_unavailable")?
                .map_err(|_| "runtime_staging_unavailable")?
                > 512 * 1024 * 1024
            {
                break Err("runtime_install_size_limit");
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    })
    .await
    .map_err(|_| "Installation timed out. The previous client remains selected.")?;
    result?;
    if size(&stage).map_err(|_| "runtime_staging_unavailable")? > 512 * 1024 * 1024 {
        return Err("runtime_install_size_limit");
    }
    let bin = stage.join("bin");
    #[cfg(unix)]
    std::os::unix::fs::symlink(node, bin.join("node")).map_err(|_| "runtime_node_unavailable")?;
    let mut verification_paths = vec![bin.clone()];
    verification_paths.extend_from_slice(paths);
    let adapter = bin.join("codex-acp");
    let cli = bin.join("codex");
    let physical_stage = stage
        .canonicalize()
        .map_err(|_| "runtime_staging_unavailable")?;
    if !paths::executable(&adapter)
        || !paths::executable(&cli)
        || !adapter
            .canonicalize()
            .is_ok_and(|p| p.starts_with(&physical_stage))
        || !cli
            .canonicalize()
            .is_ok_and(|p| p.starts_with(&physical_stage))
        || paths::package_version(&adapter, "@agentclientprotocol/codex-acp").as_deref()
            != Some(ADAPTER_VERSION)
        || paths::package_version(&cli, "@openai/codex").as_deref() != Some(CODEX_VERSION)
        || paths::probe(&adapter, &verification_paths).await.as_deref() != Some(ADAPTER_VERSION)
        || paths::probe(&cli, &verification_paths).await.as_deref() != Some(CODEX_VERSION)
    {
        return Err("Installed client verification failed. The previous client remains selected.");
    }
    let durable = stage.clone();
    tokio::task::spawn_blocking(move || {
        sync_tree(&durable)?;
        fs::File::open(durable.parent().unwrap())?.sync_all()
    })
    .await
    .map_err(|_| "runtime_directory_unavailable")?
    .map_err(|_| "runtime_directory_unavailable")?;
    Ok(())
}
