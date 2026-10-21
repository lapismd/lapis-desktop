use super::{CapturedSession, Catalog, codex_preview::CodexPreview};
use std::{io, path::Path};
pub fn preview(
    catalog: &Catalog,
    selector: &str,
    home: &Path,
    check: &dyn Fn() -> io::Result<()>,
) -> io::Result<CapturedSession> {
    preview_in(catalog, selector, home, None, check)
}
pub fn preview_for_workspace(
    catalog: &Catalog,
    selector: &str,
    home: &Path,
    workspace: &Path,
    check: &dyn Fn() -> io::Result<()>,
) -> io::Result<CapturedSession> {
    preview_in(catalog, selector, home, Some(workspace), check)
}
fn preview_in(
    catalog: &Catalog,
    selector: &str,
    home: &Path,
    workspace: Option<&Path>,
    check: &dyn Fn() -> io::Result<()>,
) -> io::Result<CapturedSession> {
    let selection = catalog.0.get(selector).ok_or_else(super::denied)?;
    let mut reader = CodexPreview::open(selection, home, workspace, None, None, check)?;
    loop {
        if let Some(capture) = reader.next(check)?.capture {
            return Ok(capture);
        }
    }
}
