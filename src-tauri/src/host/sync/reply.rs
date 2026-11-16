//! Explicit public IPC projections; native account types are not wire envelopes.
use lapis_app_core::sync::account::{
    DiscoveryCredentialStatus, HandoffStatus, owner::AccountReply,
};
use serde_json::{Value, json};
use std::io;

pub fn value(reply: AccountReply) -> io::Result<Value> {
    let value = match reply {
        AccountReply::Snapshot(snapshot) => {
            serde_json::to_value(snapshot).map_err(io::Error::other)?
        }
        AccountReply::Inspection(inspection) => json!({
            "connection_id": inspection.connection_id,
            "client_id": inspection.client_id,
            "expires_at": inspection.expires_at,
            "status": match inspection.status {
                HandoffStatus::Pending => "pending",
                HandoffStatus::Approved => "approved",
                HandoffStatus::Rejected => "rejected",
                HandoffStatus::Consumed => "consumed",
                HandoffStatus::Expired => "expired",
            },
            "credential_status": match inspection.credential_status {
                DiscoveryCredentialStatus::NotIssued => "not-issued",
                DiscoveryCredentialStatus::Active => "active",
                DiscoveryCredentialStatus::Revoked => "revoked",
                DiscoveryCredentialStatus::Expired => "expired",
                DiscoveryCredentialStatus::Unavailable => "unavailable",
            },
        }),
        AccountReply::Vaults(vaults) => Value::Array(
            vaults
                .into_iter()
                .map(|vault| {
                    json!({
                        "vault_id": vault.vault_id, "name": vault.name,
                    })
                })
                .collect(),
        ),
        AccountReply::Closed => return Err(unavailable()),
    };
    if serde_json::to_vec(&value).map_err(io::Error::other)?.len() > 64 * 1024 {
        return Err(unavailable());
    }
    Ok(value)
}

fn unavailable() -> io::Error {
    io::Error::new(
        io::ErrorKind::InvalidData,
        "Native Sync account reply is unavailable",
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use lapis_app_core::sync::account::{DiscoveredVault, HandoffInspection};
    use uuid::Uuid;

    #[test]
    fn inspection_projects_only_complete_public_status_fields() {
        let id = Uuid::nil();
        for (status, expected_status) in [
            (HandoffStatus::Pending, "pending"),
            (HandoffStatus::Approved, "approved"),
            (HandoffStatus::Rejected, "rejected"),
            (HandoffStatus::Consumed, "consumed"),
            (HandoffStatus::Expired, "expired"),
        ] {
            for (credential_status, expected_credential) in [
                (DiscoveryCredentialStatus::NotIssued, "not-issued"),
                (DiscoveryCredentialStatus::Active, "active"),
                (DiscoveryCredentialStatus::Revoked, "revoked"),
                (DiscoveryCredentialStatus::Expired, "expired"),
                (DiscoveryCredentialStatus::Unavailable, "unavailable"),
            ] {
                assert_eq!(
                    value(AccountReply::Inspection(HandoffInspection {
                        connection_id: id,
                        client_id: id,
                        expires_at: 123,
                        status,
                        credential_status,
                    }))
                    .unwrap(),
                    json!({ "connection_id": id, "client_id": id,
                    "expires_at": 123, "status": expected_status,
                    "credential_status": expected_credential })
                );
            }
        }
    }

    #[test]
    fn vault_reply_bounds_output_and_never_delivers_close_authority() {
        assert_eq!(
            value(AccountReply::Vaults(vec![DiscoveredVault {
                vault_id: Uuid::nil(),
                name: "Notes café".into(),
            }]))
            .unwrap(),
            json!([{ "vault_id": Uuid::nil(), "name": "Notes café" }])
        );
        assert!(value(AccountReply::Closed).is_err());
        assert!(
            value(AccountReply::Vaults(vec![DiscoveredVault {
                vault_id: Uuid::nil(),
                name: "x".repeat(64 * 1024),
            }]))
            .is_err()
        );
    }
}
