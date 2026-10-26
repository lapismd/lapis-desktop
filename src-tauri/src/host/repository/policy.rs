use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::repository::Grant;
use std::path::Path;
use tauri::WebviewWindow;
use tauri_plugin_jj_store::{Context, Error, Result, local};
pub fn local(caller: &Context) -> Result<()> {
    let url = url::Url::parse(&caller.url).map_err(|_| Error::Denied)?;
    if caller.window != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(Error::Denied);
    }
    Ok(())
}
pub fn caller(window: &WebviewWindow) -> Result<Context> {
    let context = Context {
        window: window.label().into(),
        url: window.url().map_err(|_| Error::Denied)?.to_string(),
    };
    local(&context)?;
    Ok(context)
}
pub(super) struct Access {
    pub(super) host: NativeHost,
    pub(super) grant: Grant,
}
#[async_trait::async_trait]
impl local::Access for Access {
    fn repository(&self) -> jj_store_model::RepositoryId {
        self.grant.repository()
    }
    fn generation(&self) -> u64 {
        self.grant.generation()
    }
    fn metadata_path(&self) -> &Path {
        self.grant.metadata_path()
    }
    async fn authorize(&self) -> Result<()> {
        let host = self.host.clone();
        let grant = self.grant.clone();
        tauri::async_runtime::spawn_blocking(move || {
            let mut services = host.0.lock().map_err(|_| Error::Unavailable)?;
            let NativeServices {
                repository, vaults, ..
            } = &mut *services;
            repository.check(vaults, &grant).map_err(|_| Error::Denied)
        })
        .await
        .map_err(|_| Error::Unavailable)?
    }
}
#[cfg(test)]
mod tests;
