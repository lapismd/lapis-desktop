//! Host selection policy only. Shared Core owns editing lifetime and recovery.
use serde::Serialize;
use std::io;

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum EditingOwner {
    #[default]
    Renderer,
    Core,
}

impl EditingOwner {
    pub fn parse(value: Option<&str>) -> io::Result<Self> {
        match value {
            None | Some("renderer") => Ok(Self::Renderer),
            Some("core") => Ok(Self::Core),
            _ => Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid editing owner selection",
            )),
        }
    }

    pub fn authorize(self, window: &str) -> io::Result<()> {
        if window != "main" {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "Local main window required",
            ));
        }
        if !matches!(self, Self::Core) {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "Native editing is not selected",
            ));
        }
        Ok(())
    }
}
