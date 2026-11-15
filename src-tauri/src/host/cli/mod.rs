pub(crate) mod access;
pub(crate) mod installation;
use lapis_desktop::cli::content::Listener;
#[derive(Default)]
pub struct ContentListener(pub tokio::sync::Mutex<Option<Listener>>);
