//! Session-only related windows. This registry grants no filesystem or IPC access.
use std::collections::HashMap;
use uuid::Uuid;

const MAX_WINDOWS: usize = 16;

#[derive(Clone, Debug)]
pub struct WindowTicket {
    label: String,
    generation: Uuid,
}
impl WindowTicket {
    pub fn label(&self) -> &str {
        &self.label
    }
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseRequest {
    label: String,
    request_id: Uuid,
}
impl CloseRequest {
    pub fn request_id(&self) -> Uuid {
        self.request_id
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum CloseOutcome {
    Approved,
    Retained,
}

enum WindowState {
    Reserved,
    Open,
    CloseRequested(Uuid),
    Closing,
}
struct Session {
    id: String,
    generation: Uuid,
    accepting: bool,
}

#[derive(Default)]
pub struct WorkspaceWindows {
    session: Option<Session>,
    windows: HashMap<String, WindowState>,
}

impl WorkspaceWindows {
    /// The host must verify the vault session before beginning window admission.
    pub fn begin(&mut self, id: &str) -> Result<(), &'static str> {
        if id.is_empty() || id.len() > 256 || id.chars().any(char::is_control) {
            return Err("Invalid workspace session");
        }
        if let Some(session) = &self.session {
            return if session.id == id && session.accepting {
                Ok(())
            } else {
                Err("Finish the original workspace session before replacing it")
            };
        }
        self.session = Some(Session {
            id: id.into(),
            generation: Uuid::new_v4(),
            accepting: true,
        });
        Ok(())
    }

    pub fn reserve(&mut self, opener: &str, url: &str) -> Result<WindowTicket, &'static str> {
        let session = self
            .session
            .as_ref()
            .ok_or("No workspace session is active")?;
        if opener != "main" || url != "about:blank" || !session.accepting {
            return Err("Related window creation is unavailable");
        }
        if self.windows.len() >= MAX_WINDOWS {
            return Err("The workspace already has sixteen related windows");
        }
        let ticket = WindowTicket {
            label: format!("workspace-popup-{}", Uuid::new_v4()),
            generation: session.generation,
        };
        self.windows
            .insert(ticket.label.clone(), WindowState::Reserved);
        Ok(ticket)
    }

    pub fn commit(&mut self, ticket: &WindowTicket) -> Result<(), &'static str> {
        if !self
            .session
            .as_ref()
            .is_some_and(|session| session.accepting && session.generation == ticket.generation)
            || !matches!(self.windows.get(&ticket.label), Some(WindowState::Reserved))
        {
            return Err("Related window creation is stale");
        }
        self.windows.insert(ticket.label.clone(), WindowState::Open);
        Ok(())
    }

    pub fn authorizes(&self, label: &str, session: &str) -> bool {
        self.session
            .as_ref()
            .is_some_and(|active| active.id == session)
            && matches!(
                self.windows.get(label),
                Some(WindowState::Open | WindowState::CloseRequested(_))
            )
    }

    pub fn request_close(&mut self, label: &str) -> Result<Option<CloseRequest>, &'static str> {
        let state = self
            .windows
            .get_mut(label)
            .ok_or("Related window is unavailable")?;
        match state {
            WindowState::Open => {
                let request_id = Uuid::new_v4();
                *state = WindowState::CloseRequested(request_id);
                Ok(Some(CloseRequest {
                    label: label.into(),
                    request_id,
                }))
            }
            WindowState::CloseRequested(_) | WindowState::Closing => Ok(None),
            WindowState::Reserved => Err("Related window creation is incomplete"),
        }
    }

    pub fn finish_close(
        &mut self,
        label: &str,
        request_id: Uuid,
        saved: bool,
    ) -> Result<CloseOutcome, &'static str> {
        let state = self
            .windows
            .get_mut(label)
            .ok_or("Related window is unavailable")?;
        if !matches!(state, WindowState::CloseRequested(expected) if *expected == request_id) {
            return Err("Related window close request is stale");
        }
        *state = if saved {
            WindowState::Closing
        } else {
            WindowState::Open
        };
        Ok(if saved {
            CloseOutcome::Approved
        } else {
            CloseOutcome::Retained
        })
    }

    pub fn retire(&mut self, label: &str) {
        self.windows.remove(label);
    }

    pub fn fence(&mut self, id: &str) -> Result<(), &'static str> {
        let session = self
            .session
            .as_mut()
            .filter(|session| session.id == id)
            .ok_or("Workspace session is stale")?;
        session.accepting = false;
        self.windows
            .retain(|_, state| !matches!(state, WindowState::Reserved));
        Ok(())
    }

    pub fn resume(&mut self, id: &str) -> Result<(), &'static str> {
        let session = self
            .session
            .as_mut()
            .filter(|session| session.id == id)
            .ok_or("Workspace session is stale")?;
        session.accepting = true;
        Ok(())
    }

    pub fn end(&mut self, id: &str) -> Result<(), &'static str> {
        if !self
            .session
            .as_ref()
            .is_some_and(|session| session.id == id && !session.accepting)
            || !self.windows.is_empty()
        {
            return Err(
                "Fence and retire the original workspace windows before ending the session",
            );
        }
        self.session = None;
        Ok(())
    }
}
