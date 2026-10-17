//! Passive receipts for actual OS actions, absent from ordinary artifacts.
use serde::Serialize;
use std::{
    fs::OpenOptions,
    io::Write,
    path::{Path, PathBuf},
};

pub fn record(operation: &str, path: &str, destination: Option<&Path>) {
    #[derive(Serialize)]
    struct Receipt<'a> {
        operation: &'a str,
        path: &'a str,
        destination: Option<&'a Path>,
    }
    let result = (|| -> Result<(), Box<dyn std::error::Error>> {
        let root = PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?);
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(root.join("file-actions.jsonl"))?;
        if file.metadata()?.len() > 128 * 1024 {
            return Err("Acceptance action receipts are full".into());
        }
        serde_json::to_writer(
            &mut file,
            &Receipt {
                operation,
                path,
                destination,
            },
        )?;
        writeln!(file)?;
        file.sync_all()?;
        Ok(())
    })();
    if let Err(error) = result {
        eprintln!("Acceptance action receipt unavailable: {error}");
    }
}
