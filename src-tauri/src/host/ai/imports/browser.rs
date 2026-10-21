use super::{NativeImports, denied, requests::Request};
use lapis_desktop::ai::imports::{BrowserPreview, ImportScope};
use serde_json::{Value, json};
use std::io;
pub(super) fn execute(
    request: &Request,
    scope: &ImportScope,
    owner: &NativeImports,
    check: &dyn Fn() -> io::Result<()>,
) -> io::Result<Option<Value>> {
    let result = match request {
        Request::Folders {
            harness, refresh, ..
        } => json!(
            owner
                .index
                .lock()
                .map_err(|_| denied())?
                .folders(*harness, *refresh, check)?
        ),
        Request::Sessions { folder, after, .. } => {
            if folder.len() != 64 || after.as_ref().is_some_and(|s| s.len() != 64) {
                return Err(denied());
            }
            json!(owner.index.lock().map_err(|_| denied())?.sessions(
                folder,
                after.as_deref(),
                check
            )?)
        }
        Request::StartPreview {
            selector, reader, ..
        } => {
            if selector.len() != 64 {
                return Err(denied());
            }
            {
                let state = scope.browser.lock().map_err(|_| denied())?;
                if state.len() >= 4 || state.contains_key(reader) {
                    return Err(denied());
                }
            }
            let selection = owner
                .index
                .lock()
                .map_err(|_| denied())?
                .select(selector, check)?;
            let mut preview = BrowserPreview::open(selection, &owner.home, check)?;
            let page = preview.next(check)?;
            check()?;
            if page.capture.is_none() {
                scope
                    .browser
                    .lock()
                    .map_err(|_| denied())?
                    .insert(*reader, preview);
            }
            let mut value = json!(page);
            value["reader"] = json!(reader);
            value
        }
        Request::NextPreview { reader, .. } => {
            let mut state = scope.browser.lock().map_err(|_| denied())?;
            let preview = state.get_mut(reader).ok_or_else(denied)?;
            let result = preview.next(check);
            if result.as_ref().map_or(true, |p| p.capture.is_some()) {
                state.remove(reader);
            }
            let mut value = json!(result?);
            value["reader"] = json!(reader);
            value
        }
        Request::ReleasePreview { reader, .. } => {
            let mut state = scope.browser.lock().map_err(|_| denied())?;
            state.remove(reader);
            Value::Null
        }
        _ => return Ok(None),
    };
    check()?;
    Ok(Some(result))
}
