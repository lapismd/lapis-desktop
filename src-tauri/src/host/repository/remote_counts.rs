//! Optional, immutable graph counts never initialize or snapshot a repository.
use super::{
    RepositoryHost,
    remote::{failure, runtime, worker},
};
use crate::host::state::NativeError;
use jj_store_jj::vault_workspace::HistoryReader;
use jj_vault::Binding;
use serde_json::Value;

pub(super) async fn attach(
    repository: &RepositoryHost,
    binding: Binding,
    mut snapshot: Value,
) -> Result<Value, NativeError> {
    snapshot["divergence"] = Value::Null;
    if snapshot["configuration"].is_null() {
        return Ok(snapshot);
    }
    let Some(incoming) = snapshot["checkpoint"]["commit"].as_str().map(str::to_owned) else {
        return Ok(snapshot);
    };
    let counts = worker(repository, move || {
        runtime()?.block_on(async {
            HistoryReader::open(binding)
                .await
                .map_err(std::io::Error::other)?
                .divergence(&incoming)
                .await
                .map_err(std::io::Error::other)
        })
    })
    .await;
    // Optional counts can be unavailable on an uninitialized, stale, busy or
    // oversized history. Fetch remains usable; never substitute a partial zero.
    if let Ok(Some(counts)) = counts {
        snapshot["divergence"] = serde_json::to_value(counts).map_err(failure)?;
    }
    Ok(snapshot)
}
