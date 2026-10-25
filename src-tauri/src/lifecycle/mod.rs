use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum LeaveAction {
    Close,
    Reload,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaveRequest {
    pub request_id: String,
    pub action: LeaveAction,
}

#[derive(Default)]
pub struct Lifecycle {
    ready: bool,
    approved_exit: bool,
    pending: Option<LeaveRequest>,
}

impl Lifecycle {
    pub fn approved_exit(&self) -> bool {
        self.approved_exit
    }

    pub fn ready(&mut self) -> Option<LeaveRequest> {
        self.ready = true;
        self.pending.clone()
    }

    pub fn request(&mut self, action: LeaveAction) -> Option<LeaveRequest> {
        if let Some(pending) = &mut self.pending {
            if action == LeaveAction::Close {
                pending.action = LeaveAction::Close;
            }
            return None;
        }
        if self.approved_exit {
            return None;
        }
        let request = LeaveRequest {
            request_id: Uuid::new_v4().to_string(),
            action,
        };
        self.pending = Some(request.clone());
        self.ready.then_some(request)
    }

    pub fn action(&self, request_id: &str) -> Result<LeaveAction, String> {
        let request = self
            .pending
            .as_ref()
            .ok_or("No lifecycle request is pending")?;
        if request.request_id != request_id {
            return Err("Lifecycle acknowledgement does not match the pending request".into());
        }
        Ok(request.action)
    }

    pub fn finish(&mut self, request_id: &str, saved: bool) -> Result<Option<LeaveAction>, String> {
        let action = self.action(request_id)?;
        self.pending = None;
        if !saved {
            return Ok(None);
        }
        match action {
            LeaveAction::Close => self.approved_exit = true,
            LeaveAction::Reload => self.ready = false,
        }
        Ok(Some(action))
    }
}
