use jj_forge::accounts::{Manager, now};
use jj_vault::{GitCredentials, RemoteTarget};
use std::io;
use url::Url;

/// Native-only account resolution. Credentials cannot be serialized into IPC.
pub struct RemoteAccess {
    pub account: String,
    pub project: String,
    pub target: RemoteTarget,
    pub can_push: bool,
    pub credentials: GitCredentials,
}
pub(super) async fn resolve(
    manager: &Manager,
    id: &str,
    project: &str,
    branch: Option<String>,
) -> io::Result<RemoteAccess> {
    let error = |message: &str| io::Error::other(format!("Remote backup: {message}"));
    let account = manager
        .account(id)
        .map_err(|_| error("Account is unavailable"))?;
    let timestamp = now().map_err(|_| error("Clock is unavailable"))?;
    let repository = manager
        .repository(&account, project, timestamp)
        .await
        .map_err(|e| error(&e.to_string()))?;
    let name = repository
        .get("full_name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| error("Repository identity is unavailable"))?;
    if !name.eq_ignore_ascii_case(project) {
        return Err(error("Repository identity changed"));
    }
    let clone_url = repository
        .get("clone_url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| error("Git endpoint is unavailable"))?;
    let git = Url::parse(clone_url).map_err(|_| error("Git endpoint is invalid"))?;
    let api = Url::parse(&account.api_url).map_err(|_| error("Forge endpoint is invalid"))?;
    let approved_origin = if account.api_url == "https://api.github.com" {
        "https://github.com".to_owned()
    } else {
        api.origin().ascii_serialization()
    };
    if git.origin().ascii_serialization() != approved_origin
        || !git
            .path()
            .trim_start_matches('/')
            .trim_end_matches(".git")
            .eq_ignore_ascii_case(name)
    {
        return Err(error(
            "Git endpoint does not belong to the selected forge repository",
        ));
    }
    let branch = branch
        .filter(|value| !value.is_empty())
        .or_else(|| {
            repository
                .get("default_branch")
                .and_then(|v| v.as_str())
                .map(str::to_owned)
        })
        .ok_or_else(|| error("Choose a backup branch"))?;
    let target = RemoteTarget {
        url: clone_url.into(),
        branch,
    };
    target
        .validate()
        .map_err(|_| error("Git endpoint or branch is invalid"))?;
    let credential = manager
        .credential(id, timestamp)
        .await
        .map_err(|_| error("Account needs authorization"))?;
    let credentials = if jj_forge::accounts::forgejo_api_root(&account.api_url).is_ok() {
        GitCredentials::basic(&account.login, &credential.access_token)
    } else {
        GitCredentials::token(&credential.access_token)
    }
    .map_err(|_| error("Account credential is invalid"))?;
    let can_push = repository
        .pointer("/permissions/push")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
        && !repository
            .get("archived")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
    Ok(RemoteAccess {
        account: id.into(),
        project: name.into(),
        target,
        can_push,
        credentials,
    })
}
