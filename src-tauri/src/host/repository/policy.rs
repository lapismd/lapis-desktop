use crate::host::state::{NativeHost, NativeServices};
use lapis_desktop::repository::Grant;
use std::{path::Path, sync::Arc};
use tauri::WebviewWindow;
use tauri_plugin_jj_store::{Admission, Context, Error, Result, local};
#[derive(Clone)]
pub struct Policy(pub NativeHost);
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
#[async_trait::async_trait]
impl Admission for Policy {
    async fn admit(&self, caller: &Context, vault: &str) -> Result<Arc<dyn local::Access>> {
        local(caller)?;
        let host = self.0.clone();
        let caller = caller.clone();
        let vault = vault.to_owned();
        let grant = tauri::async_runtime::spawn_blocking(move || {
            let mut services = host.0.lock().map_err(|_| Error::Unavailable)?;
            let NativeServices {
                repository, vaults, ..
            } = &mut *services;
            repository
                .authorize(vaults, &caller.window, &vault)
                .map_err(|_| Error::Denied)
        })
        .await
        .map_err(|_| Error::Unavailable)??;
        Ok(Arc::new(Access {
            host: self.0.clone(),
            grant,
        }))
    }
}
struct Access {
    host: NativeHost,
    grant: Grant,
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
