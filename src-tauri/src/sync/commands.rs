//! Allowlisted presentation actions; Core retains credentials and execution.
use lapis_app_core::sync::account::owner::AccountCommand;
use serde::Deserialize;
use serde_json::Value;
use std::io;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NativeSyncCommand {
    provider: String,
    request_id: String,
    operation: String,
    input: Value,
}

pub enum SyncAction {
    Configure { origin: String },
    Account(AccountCommand),
    OpenApproval,
}
impl NativeSyncCommand {
    pub fn request_id(&self) -> &str {
        &self.request_id
    }

    /// `now` comes from the native host, never deserialized presentation data.
    pub fn action(&self, now: i64) -> io::Result<SyncAction> {
        if self.provider != "lapis-server"
            || self.request_id.is_empty()
            || self.request_id.len() > 128
            || self.request_id.chars().any(char::is_control)
            || self.operation.len() > 64
            || now < 0
        {
            return Err(invalid());
        }
        let input = self.input.as_object().ok_or_else(invalid)?;
        if self.operation == "account-configure" {
            if input.len() != 1 {
                return Err(invalid());
            }
            let origin = input
                .get("serverOrigin")
                .and_then(Value::as_str)
                .filter(|origin| {
                    !origin.is_empty()
                        && origin.len() <= 2048
                        && !origin.chars().any(char::is_control)
                })
                .ok_or_else(invalid)?;
            return Ok(SyncAction::Configure {
                origin: origin.into(),
            });
        }
        if !input.is_empty() {
            return Err(invalid());
        }
        let command = match self.operation.as_str() {
            "account-snapshot" => AccountCommand::Snapshot,
            "account-begin" => AccountCommand::Begin {
                name: "Lapis Desktop".into(),
                now,
            },
            "account-continue" => AccountCommand::ContinuePrepared { now },
            "account-redeem" => AccountCommand::Redeem { now },
            "account-inspect" => AccountCommand::Inspect,
            "account-discover" => AccountCommand::Discover { now },
            "account-disconnect" => AccountCommand::Disconnect { now },
            "account-abandon" => AccountCommand::AbandonUnissued { now },
            "account-retry-custody" => AccountCommand::RetryCustody,
            "account-open-approval" => return Ok(SyncAction::OpenApproval),
            _ => return Err(invalid()),
        };
        Ok(SyncAction::Account(command))
    }
}

fn invalid() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidInput,
        "Invalid native Sync account command",
    )
}
