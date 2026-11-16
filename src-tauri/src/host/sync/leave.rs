//! Native-only account leave preparation; caller retains the shared transition guard.
use super::super::state::{NativeError, NativeHost, NativeServices, access};
use lapis_desktop::sync::account::leave::PreparedSessionClose;
use std::io;

pub async fn prepare(
    host: NativeHost,
    session: &str,
    reload: bool,
) -> Result<Option<PreparedSessionClose>, NativeError> {
    let session = session.to_owned();
    let preparation = access(host, move |services| {
        let NativeServices { sync, vaults, .. } = services;
        sync.as_mut()
            .map(|sync| sync.prepare_session_close(vaults, &session, reload))
            .transpose()
    })
    .await?;
    match preparation {
        Some(preparation) => Ok(Some(preparation.wait().await?)),
        None => Ok(None),
    }
}

pub fn validate(
    services: &NativeServices,
    session: &str,
    prepared: Option<&PreparedSessionClose>,
) -> io::Result<()> {
    match (&services.sync, prepared) {
        (Some(sync), Some(prepared)) => {
            sync.validate_session_close(&services.vaults, session, prepared)
        }
        (None, None) => Ok(()),
        _ => Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Sync leave preparation is missing",
        )),
    }
}

/// Invoked only off UI/async executors, after other leave checks and file-gate admission.
pub fn commit(
    services: &mut NativeServices,
    session: &str,
    prepared: Option<PreparedSessionClose>,
) -> io::Result<()> {
    validate(services, session, prepared.as_ref())?;
    if let Some(prepared) = prepared {
        let proof = prepared.commit()?;
        let sync = services
            .sync
            .as_mut()
            .ok_or_else(|| io::Error::other("Sync owner disappeared"))?;
        sync.finish_session_close(&services.vaults, proof)?;
        sync.collect_closed();
    }
    Ok(())
}

/// Native Quit preparation reconciles owners retained by earlier renderer reloads.
pub async fn close_detached(host: NativeHost) -> Result<(), NativeError> {
    let preparation = access(host.clone(), |services| {
        services
            .sync
            .as_ref()
            .map(|sync| sync.prepare_detached_close())
            .transpose()
    })
    .await?;
    let prepared = match preparation {
        Some(preparation) => Some(preparation.wait().await?),
        None => None,
    };
    access(host, move |services| {
        if let (Some(sync), Some(prepared)) = (&services.sync, &prepared) {
            sync.validate_detached_close(prepared)?;
        }
        services.core_vaults.close_detached()?;
        if let Some(prepared) = prepared {
            services
                .sync
                .as_mut()
                .ok_or_else(|| io::Error::other("Sync owner disappeared"))?
                .commit_detached_close(prepared)?;
        }
        Ok(())
    })
    .await
}
