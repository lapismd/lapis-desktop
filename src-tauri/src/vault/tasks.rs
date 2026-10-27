//! Desktop selection only. Core owns Task policy, journals and execution.
use serde::Serialize;
use std::io;

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TasksOwner {
    #[default]
    Renderer,
    Core,
}

impl TasksOwner {
    pub fn parse(value: Option<&str>) -> io::Result<Self> {
        match value {
            None | Some("renderer") => Ok(Self::Renderer),
            Some("core") => Ok(Self::Core),
            _ => Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Invalid Tasks owner selection",
            )),
        }
    }

    pub fn is_core(self) -> bool {
        matches!(self, Self::Core)
    }

    pub fn validate(self, metadata_core: bool, editing_core: bool) -> io::Result<()> {
        if self.is_core() && (!metadata_core || !editing_core) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Native Tasks require LAPIS_DESKTOP_METADATA_OWNER=core and LAPIS_DESKTOP_EDITING_OWNER=core",
            ));
        }
        Ok(())
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
                "Native Tasks are not selected",
            ));
        }
        Ok(())
    }
}
