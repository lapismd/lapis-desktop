//! Original request observation and explicit local stop, never replay.
use super::{
    remote::{bound, failure, runtime, worker},
    remote_transfer::Context,
};
use crate::host::state::NativeError;
use lapis_desktop::repository::remote::{self, RemoteState};
use std::io;
fn id(value: &str) -> Result<(), NativeError> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
    {
        return Err(failure("Invalid original push identity"));
    }
    Ok(())
}
pub(super) async fn observe(
    context: Context<'_>,
    revision: u64,
    request_id: String,
) -> Result<RemoteState, NativeError> {
    id(&request_id)?;
    let state = context.current().await?;
    if state.revision != revision
        || state.publication.as_ref().map(|p| p.request_id.as_str()) != Some(&request_id)
    {
        return Err(failure("Original push changed; refresh before checking"));
    }
    if state.publication.as_ref().is_some_and(|p| {
        matches!(
            p.outcome,
            jj_vault::PushOutcome::Complete
                | jj_vault::PushOutcome::Stale
                | jj_vault::PushOutcome::Stopped
        )
    }) {
        return stop(context, revision, request_id).await;
    }
    let (transfer, _) = context.transfer(revision).await?;
    // Read-only account access is sufficient; this never sends a push.
    worker(context.repository, move || {
        runtime()?.block_on(async {
            transfer
                .reconcile(&request_id)
                .await
                .map_err(|e| io::Error::other(e.to_string()))?;
            Ok(())
        })
    })
    .await?;
    context.current().await
}
pub(super) async fn stop(
    context: Context<'_>,
    revision: u64,
    request_id: String,
) -> Result<RemoteState, NativeError> {
    id(&request_id)?;
    let _mutation = context.repository.remote_mutations.lock().await;
    // No account or network access is required to retain a stopped receipt.
    bound(
        context.host,
        context.session,
        context.binding,
        move |binding| {
            if remote::read(binding)?.revision != revision {
                return Err(io::Error::other(
                    "Connection changed; refresh before stopping this request",
                ));
            }
            binding
                .stop_publication(&request_id)
                .map_err(|e| io::Error::other(e.to_string()))?;
            remote::read(binding)
        },
    )
    .await
}
