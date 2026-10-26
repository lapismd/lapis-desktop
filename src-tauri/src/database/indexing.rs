use lapis_app_protocol::indexing::IndexingCommand;
use serde::{Deserialize, Serialize};
use std::io;

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MetadataOwner {
    #[default]
    Renderer,
    Core,
}

impl MetadataOwner {
    pub fn parse(value: Option<&str>) -> io::Result<Self> {
        match value {
            None | Some("renderer") => Ok(Self::Renderer),
            Some("core") => Ok(Self::Core),
            _ => Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid metadata owner selection",
            )),
        }
    }
    pub fn is_core(self) -> bool {
        matches!(self, Self::Core)
    }
    pub fn authorize(self, window: &str) -> io::Result<()> {
        if window != "main" {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Local main window required",
            ));
        }
        if !self.is_core() {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Native metadata is not selected",
            ));
        }
        Ok(())
    }
    pub fn authorize_command(self, command: &IndexingCommand) -> io::Result<()> {
        if matches!(
            command,
            IndexingCommand::SelectSearch { .. } | IndexingCommand::DisableSearch {}
        ) {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Native Search selection is not available in the metadata intake",
            ));
        }
        Ok(())
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct IndexingRequest {
    pub session_id: String,
    pub connection_id: String,
    pub command: IndexingCommand,
}
