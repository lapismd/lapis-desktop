/** Real WebKit defers menu completion while its native window is occluded. */
export async function focusNativeWindow(browser) {
  await browser.execute(() =>
    globalThis.__TAURI__.window.getCurrentWindow().setFocus(),
  );
  await browser.waitUntil(
    () => browser.execute(() => document.visibilityState === "visible"),
    {
      timeout: 15000,
      timeoutMsg:
        "The actual native WebView must be visible before interaction",
    },
  );
  await browser.executeAsync((done) => requestAnimationFrame(() => done(true)));
}
