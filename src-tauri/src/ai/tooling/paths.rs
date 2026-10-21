//! One resolver for discovery and launch; never searches disposable npm caches.
use super::*;
pub(super) fn prefix(root: &Path, request: RequestId) -> PathBuf {
    root.join("tooling").join(request.to_string())
}
pub(super) fn executable(path: &Path) -> bool {
    let Ok(metadata) = path.metadata() else {
        return false;
    };
    if !metadata.is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt as _;
        metadata.permissions().mode() & 0o111 != 0
    }
    #[cfg(not(unix))]
    {
        false
    }
}
pub fn directories(profile: &Path, selection: Option<RequestId>) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Some(request) = selection {
        paths.push(prefix(&profile.join("ai-clients"), request).join("bin"));
    }
    if let Ok(bytes) = fs::read(profile.join("ai-runtime.json"))
        && bytes.len() <= 16384
        && let Ok(value) = serde_json::from_slice::<serde_json::Value>(&bytes)
        && let Some(configured) = value["path"].as_array()
    {
        paths.extend(
            configured
                .iter()
                .filter_map(|v| v.as_str())
                .map(PathBuf::from)
                .filter(|p| p.is_absolute() && p.is_dir())
                .take(8),
        );
    }
    if let Some(ambient) = std::env::var_os("PATH") {
        paths.extend(std::env::split_paths(&ambient).filter(|p| p.is_absolute() && p.is_dir()));
    }
    paths.extend(
        ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"]
            .map(PathBuf::from)
            .into_iter()
            .filter(|p| p.is_dir()),
    );
    paths.dedup();
    match std::env::var_os("HOME") {
        Some(home) => with_user_bin(paths, Path::new(&home)),
        None => paths,
    }
}
/// Supplement device configuration with the ordinary user-local client install.
/// Configured and selected managed directories keep their original priority.
pub fn with_user_bin(mut paths: Vec<PathBuf>, home: &Path) -> Vec<PathBuf> {
    let user_bin = home.join(".local/bin");
    if user_bin.is_absolute() && user_bin.is_dir() && !paths.contains(&user_bin) {
        paths.push(user_bin);
    }
    paths
}
pub(super) fn resolve(paths: &[PathBuf], name: &str) -> Option<PathBuf> {
    paths.iter().map(|p| p.join(name)).find(|p| executable(p))
}
pub(super) fn package_version(executable: &Path, name: &str) -> Option<String> {
    let resolved = executable.canonicalize().ok()?;
    for parent in resolved.ancestors().skip(1).take(4) {
        let manifest = parent.join("package.json");
        let metadata = fs::metadata(&manifest).ok();
        if !metadata.is_some_and(|m| m.is_file() && m.len() <= 65536) {
            continue;
        }
        let value: serde_json::Value = serde_json::from_slice(&fs::read(manifest).ok()?).ok()?;
        if value["name"].as_str() == Some(name) {
            return value["version"]
                .as_str()
                .filter(|v| version(v).is_some())
                .map(str::to_owned);
        }
    }
    None
}
pub(super) fn version(text: &str) -> Option<(u32, u32, u32)> {
    text.split_whitespace().find_map(|word| {
        let mut parts = word.trim_start_matches('v').split('.');
        let major = parts.next()?.parse().ok()?;
        let minor = parts.next()?.parse().ok()?;
        let patch = parts.next()?.parse().ok()?;
        parts.next().is_none().then_some((major, minor, patch))
    })
}
pub(super) async fn probe(bin: &Path, paths: &[PathBuf]) -> Option<String> {
    let mut command = tokio::process::Command::new(bin);
    command
        .arg("--version")
        .env("PATH", std::env::join_paths(paths).ok()?)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .kill_on_drop(true);
    #[cfg(unix)]
    command.process_group(0);
    let mut child = super::install::Process(command.spawn().ok()?);
    let mut stdout = child.0.stdout.take()?;
    use tokio::io::AsyncReadExt as _;
    let mut bytes = Vec::new();
    tokio::time::timeout(Duration::from_secs(3), async {
        (&mut stdout)
            .take(4097)
            .read_to_end(&mut bytes)
            .await
            .ok()?;
        if bytes.len() > 4096 || !child.0.wait().await.ok()?.success() {
            return None;
        }
        let value = std::str::from_utf8(&bytes).ok()?.lines().next()?.trim();
        if value.is_empty() || value.len() > 256 || value.chars().any(char::is_control) {
            return None;
        }
        Some(value.to_owned())
    })
    .await
    .ok()
    .flatten()
}
