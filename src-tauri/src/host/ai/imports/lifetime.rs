use super::{NativeImports, denied};
use crate::host::state::{NativeError, NativeHost, access};
use std::{io, sync::Arc};
use tauri::Manager;
use uuid::Uuid;
impl NativeImports {
    pub(super) fn fence(&self, window: &str, handle: Option<Uuid>) -> io::Result<()> {
        let owners = self.owners.lock().map_err(|_| denied())?;
        if let Some(owner) = owners
            .get(window)
            .filter(|o| handle.is_none_or(|h| o.handle == h))
        {
            owner.scope.fence()?;
        }
        Ok(())
    }
    pub(super) async fn drain(&self, window: &str, handle: Option<Uuid>) -> io::Result<()> {
        self.fence(window, handle)?;
        let retained = self
            .owners
            .lock()
            .map_err(|_| denied())?
            .get(window)
            .filter(|o| handle.is_none_or(|h| o.handle == h))
            .map(|o| (o.handle, o.scope.clone()));
        if let Some((handle, scope)) = retained {
            scope.drain().await?;
            let mut owners = self.owners.lock().map_err(|_| denied())?;
            if owners.get(window).is_some_and(|o| o.handle == handle) {
                owners.remove(window);
            }
        }
        Ok(())
    }
}
pub async fn close_vault(
    app: &tauri::AppHandle,
    host: NativeHost,
    session: &str,
) -> Result<(), NativeError> {
    let imports = app.state::<Arc<NativeImports>>();
    let _transition = imports.transitions.lock().await;
    let closing = session.to_owned();
    access(host, move |services| {
        services.vaults.get(&closing)?;
        if services.databases.has_session(&closing) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        services.imports.begin_close_vault(&closing);
        Ok(())
    })
    .await?;
    let windows: Vec<_> = imports
        .owners
        .lock()
        .map_err(|_| denied())?
        .iter()
        .filter(|(_, o)| o.session == session)
        .map(|(w, _)| w.clone())
        .collect();
    for window in windows {
        imports.drain(&window, None).await?;
    }
    Ok(())
}
pub fn window_destroyed(app: &tauri::AppHandle, window: &str) {
    let Some(imports) = app.try_state::<Arc<NativeImports>>() else {
        return;
    };
    let imports = imports.inner().clone();
    // Fence synchronously, before scheduling any cleanup.
    if let Ok(mut destroyed) = imports.destroyed.lock() {
        destroyed.insert(window.into());
    }
    if let Err(error) = imports.fence(window, None) {
        eprintln!("Import fence failed: {error}");
    }
    if let Some(host) = app.try_state::<NativeHost>()
        && let Ok(mut services) = host.0.lock()
    {
        services.imports.leave(window, false);
    }
    let window = window.to_owned();
    tauri::async_runtime::spawn(async move {
        let _transition = imports.transitions.lock().await;
        if let Err(error) = imports.drain(&window, None).await {
            eprintln!("Import cleanup failed: {error}");
        }
    });
}
