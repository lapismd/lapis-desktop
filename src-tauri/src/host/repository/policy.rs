use tauri::WebviewWindow;
use tauri_plugin_jj_store::{Context, Error, Result};
pub fn local(caller: &Context) -> Result<()> {
    let url = url::Url::parse(&caller.url).map_err(|_| Error::Denied)?;
    if caller.window != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(Error::Denied);
    }
    Ok(())
}
pub fn caller(window: &WebviewWindow) -> Result<Context> {
    let context = Context {
        window: window.label().into(),
        url: window.url().map_err(|_| Error::Denied)?.to_string(),
    };
    local(&context)?;
    Ok(context)
}
#[cfg(test)]
mod tests;
