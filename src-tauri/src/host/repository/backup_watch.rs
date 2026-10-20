use crate::host::state::{NativeError, NativeHost, access};

pub(super) async fn start(
    host: NativeHost,
    session: String,
    changes: jj_vault::Changes,
) -> Result<String, NativeError> {
    access(host, move |s| {
        s.watches.start_filtered(
            &session,
            s.vaults.get(&session)?,
            lapis_desktop::watch::WatchOptions {
                backup_content: true,
                scope: String::new(),
                recursive: true,
                ignored_names: [".jj", ".git", ".DS_Store"]
                    .into_iter()
                    .map(str::to_owned)
                    .collect(),
            },
            s.fs_gate.clone(),
            move |batch| {
                if !batch.changes.is_empty() || batch.reconciliation {
                    changes.changed();
                }
                true
            },
        )
    })
    .await
}
