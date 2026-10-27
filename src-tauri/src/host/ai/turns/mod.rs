//! Tauri admission only; the Notes service retains journal, workers and writers.
use crate::host::state::{NativeError, NativeHost};
use lapis_app_protocol::turns::{TurnCommand, TurnValue};
use serde::{Deserialize, Serialize};
use std::{io, sync::Arc};
use tauri::WebviewWindow;

mod access;
pub mod queue;

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TurnOwner {
    #[default]
    Renderer,
    Core,
}
impl TurnOwner {
    pub fn parse(value: Option<&str>) -> io::Result<Self> {
        match value {
            None | Some("renderer") => Ok(Self::Renderer),
            Some("core") => Ok(Self::Core),
            _ => Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid AI owner selection",
            )),
        }
    }
    pub fn is_core(self) -> bool {
        matches!(self, Self::Core)
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    command: TurnCommand,
}

#[tauri::command]
pub async fn desktop_ai_turn(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: Request,
) -> Result<TurnValue, NativeError> {
    access::call(window, host, request.session_id, move |client| {
        client.call_turn(request.command).map_err(io::Error::other)
    })
    .await
}

#[derive(Default)]
pub struct Retained(
    std::sync::Mutex<
        std::collections::HashMap<(String, String), Arc<lapis_app_core::services::Client>>,
    >,
);
impl Retained {
    fn retain(
        &self,
        window: &str,
        generation: &str,
        client: Arc<lapis_app_core::services::Client>,
    ) -> io::Result<()> {
        self.0
            .lock()
            .map_err(|_| io::Error::other("Native turns unavailable"))?
            .insert((window.into(), generation.into()), client);
        Ok(())
    }
    pub async fn drain(&self, window: &str, generation: Option<&str>) -> io::Result<()> {
        let clients: Vec<_> = self
            .0
            .lock()
            .map_err(|_| io::Error::other("Native turns unavailable"))?
            .iter()
            .filter(|((w, g), _)| w == window && generation.is_none_or(|value| value == g))
            .map(|(key, client)| (key.clone(), client.clone()))
            .collect();
        let completed = tauri::async_runtime::spawn_blocking(move || {
            for (_, client) in &clients {
                client.set_turns_enabled(false).map_err(io::Error::other)?;
            }
            Ok::<_, io::Error>(clients)
        })
        .await
        .map_err(|_| io::Error::other("Native turn cleanup interrupted"))??;
        let mut retained = self
            .0
            .lock()
            .map_err(|_| io::Error::other("Native turns unavailable"))?;
        for (key, client) in completed {
            if retained
                .get(&key)
                .is_some_and(|current| Arc::ptr_eq(current, &client))
            {
                retained.remove(&key);
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shared_turn_owner_selection_is_fixed_and_invalid_values_refuse() {
        use crate::host::ai::turns::TurnOwner;
        assert!(!TurnOwner::parse(None).unwrap().is_core());
        assert!(!TurnOwner::parse(Some("renderer")).unwrap().is_core());
        assert!(TurnOwner::parse(Some("core")).unwrap().is_core());
        for value in ["", "CORE", "deno", " core "] {
            assert!(TurnOwner::parse(Some(value)).is_err());
        }
    }

    #[test]
    fn turn_frames_reject_browser_authority_and_invalid_identity() {
        assert!(
            serde_json::from_value::<Request>(
                serde_json::json!({"sessionId":"vault","command":{"kind":"list"}})
            )
            .is_ok()
        );
        for value in [
            serde_json::json!({"sessionId":"vault","command":{"kind":"list"},"window":"other"}),
            serde_json::json!({"sessionId":"vault","command":{"kind":"list","root":"/other"}}),
            serde_json::json!({"sessionId":"vault","command":{"kind":"read","request_id":"bad"}}),
        ] {
            assert!(serde_json::from_value::<Request>(value).is_err());
        }
    }
}
