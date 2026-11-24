//! Passive records of real renderer admissions, absent from ordinary builds.
use lapis_desktop::vault::VaultDescriptor;
use std::{fs::OpenOptions, io::Write, path::PathBuf};

pub fn record(selected: Option<&VaultDescriptor>) {
    let Some(selected) = selected else { return };
    let result = (|| -> Result<(), Box<dyn std::error::Error>> {
        let root = PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?);
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(root.join("vault-admissions.jsonl"))?;
        if file.metadata()?.len() > 64 * 1024 {
            return Err("Acceptance admission receipts are full".into());
        }
        serde_json::to_writer(
            &mut file,
            &serde_json::json!({
                "profileId": selected.profile_id,
                "sessionId": selected.session_id,
            }),
        )?;
        writeln!(file)?;
        file.sync_all()?;
        Ok(())
    })();
    if let Err(error) = result {
        eprintln!("Acceptance admission receipt unavailable: {error}");
    }
}
