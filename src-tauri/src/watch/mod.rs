mod pending;
mod registry;
mod snapshot;

pub use registry::WatchRegistry;

#[derive(Default)]
pub struct WatchOptions {
    pub scope: String,
    pub recursive: bool,
    pub ignored_names: Vec<String>,
}
fn ignored(path: &str, names: &[String]) -> bool {
    path.split('/')
        .any(|part| names.iter().any(|name| part == name))
}

use crate::vault::VaultRoot;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use pending::Pending;
use serde::Serialize;
use std::{
    io,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc,
    },
    thread::{self, JoinHandle},
    time::Duration,
};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchChange {
    pub r#type: &'static str,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub previous_path: Option<String>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchBatch {
    pub sequence: u64,
    pub changes: Vec<WatchChange>,
    pub reconciliation: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub struct NativeWatch {
    active: Arc<AtomicBool>,
    wake: mpsc::SyncSender<()>,
    worker: Option<JoinHandle<()>>,
}
impl NativeWatch {
    pub fn start(
        root: &VaultRoot,
        scope: &str,
        recursive: bool,
        io_gate: Arc<Mutex<()>>,
        listener: impl Fn(WatchBatch) -> bool + Send + 'static,
    ) -> io::Result<Self> {
        Self::start_filtered(
            root,
            WatchOptions {
                scope: scope.into(),
                recursive,
                ignored_names: vec![],
            },
            io_gate,
            listener,
        )
    }
    pub fn start_filtered(
        root: &VaultRoot,
        options: WatchOptions,
        io_gate: Arc<Mutex<()>>,
        listener: impl Fn(WatchBatch) -> bool + Send + 'static,
    ) -> io::Result<Self> {
        let root = root.clone_for_watch()?;
        let WatchOptions {
            scope,
            recursive,
            ignored_names,
        } = options;
        if ignored_names.len() > 64
            || ignored_names
                .iter()
                .any(|name| name.is_empty() || name.contains(['/', '\\']) || name.len() > 255)
        {
            return Err(io::Error::other("Invalid native watch exclusions"));
        }
        let active = Arc::new(AtomicBool::new(true));
        let pending = Arc::new(Mutex::new(Pending::default()));
        let (wake, receive) = mpsc::sync_channel(1);
        let signal = wake.clone();
        let hints = pending.clone();
        let root_path = root.path().to_owned();
        let watched_scope = scope.clone();
        let hints_ignored = ignored_names.clone();
        let guard = io_gate
            .lock()
            .map_err(|_| io::Error::other("File IO owner is unavailable"))?;
        root.checked(&scope, scope.is_empty())?;
        snapshot::validate_root(&root)?;
        let mut watcher = RecommendedWatcher::new(
            move |event| {
                if let Ok(mut hints) = hints.lock()
                    && hints.push(&root_path, &watched_scope, recursive, event, &hints_ignored)
                {
                    let _ = signal.try_send(());
                }
            },
            Config::default().with_follow_symlinks(false),
        )
        .map_err(io::Error::other)?;
        // Watching the admission root also observes atomic replacement or recreation
        // of a scoped file/directory; the snapshot and hints enforce delivery scope.
        watcher
            .watch(
                root.path(),
                if recursive || !scope.is_empty() {
                    RecursiveMode::Recursive
                } else {
                    RecursiveMode::NonRecursive
                },
            )
            .map_err(io::Error::other)?;
        let mut previous = snapshot::read(&root, &scope, recursive, &ignored_names)?;
        drop(guard);
        let running = active.clone();
        let worker = thread::spawn(move || {
            let _watcher = watcher;
            let mut sequence = 0;
            let mut uncertain = false;
            while receive.recv().is_ok() {
                if !running.load(Ordering::Acquire) {
                    break;
                }
                thread::sleep(Duration::from_millis(35));
                while receive.try_recv().is_ok() {}
                let hints = pending
                    .lock()
                    .map(|mut pending| std::mem::take(&mut *pending))
                    .unwrap_or(Pending {
                        paths: Default::default(),
                        reconciliation: true,
                    });
                let mut batch = WatchBatch {
                    sequence: sequence + 1,
                    changes: vec![],
                    reconciliation: uncertain || hints.reconciliation,
                    error: None,
                };
                let scan = io_gate
                    .lock()
                    .map_err(|_| io::Error::other("File IO owner is unavailable"))
                    .and_then(|_guard| snapshot::read(&root, &scope, recursive, &ignored_names));
                match scan {
                    Ok(next) => {
                        batch.changes = snapshot::changes(&previous, &next, &hints.paths);
                        previous = next;
                        let bytes: usize = batch
                            .changes
                            .iter()
                            .map(|change| {
                                change.path.len()
                                    + change.previous_path.as_ref().map_or(0, String::len)
                                    + 64
                            })
                            .sum();
                        if batch.changes.len() > 256 || bytes > 128 * 1024 {
                            batch.changes.clear();
                            batch.reconciliation = true;
                        }
                        uncertain = false;
                    }
                    Err(error) => {
                        batch.reconciliation = true;
                        batch.error = Some(error.to_string());
                        uncertain = true;
                    }
                }
                if batch.changes.is_empty() && !batch.reconciliation {
                    continue;
                }
                if !running.load(Ordering::Acquire) {
                    break;
                }
                sequence += 1;
                if !listener(batch) {
                    break;
                }
            }
            running.store(false, Ordering::Release);
        });
        Ok(Self {
            active,
            wake,
            worker: Some(worker),
        })
    }
    pub fn close(&mut self) -> io::Result<()> {
        self.active.store(false, Ordering::Release);
        let _ = self.wake.try_send(());
        if let Some(worker) = self.worker.take() {
            worker
                .join()
                .map_err(|_| io::Error::other("Native watcher failed during shutdown"))?;
        }
        Ok(())
    }
}
impl Drop for NativeWatch {
    fn drop(&mut self) {
        let _ = self.close();
    }
}
