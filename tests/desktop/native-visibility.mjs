/** Real WebKit defers menu completion while its native window is occluded. */
export async function focusNativeWindow(browser) {
  await browser.execute(() =>
    globalThis.__TAURI__.window.getCurrentWindow().setFocus(),
  );
  try {
    await browser.waitUntil(
      async () => {
        if (await browser.execute(() => document.visibilityState === "visible"))
          return true;
        await browser.execute(() =>
          globalThis.__TAURI__.window.getCurrentWindow().setFocus(),
        );
        return false;
      },
      {
        timeout: 15000,
        timeoutMsg:
          "The actual native WebView must be visible before interaction",
      },
    );
  } catch (error) {
    const state = await browser.execute(async () => ({
      visibility: document.visibilityState,
      focused: document.hasFocus(),
      native: await globalThis.__TAURI__.core.invoke("shell_info"),
    }));
    throw new Error(`${error.message}: ${JSON.stringify(state)}`, {
      cause: error,
    });
  }
  await browser.executeAsync((done) => requestAnimationFrame(() => done(true)));
}
