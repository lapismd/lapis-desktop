/** Shared real, hidden caller-isolation fixture. A vanished window stays failed. */
export async function openSecondaryWindow(session, create) {
  const browser = session.browser;
  const started = performance.now();
  const label = "acp-other";
  const record = (phase, detail = {}) =>
    console.log(
      JSON.stringify({
        kind: "native-secondary-window",
        session: session.id ?? "native",
        phase,
        label,
        elapsedMs: Math.round(performance.now() - started),
        ...detail,
      }),
    );
  const observeHandles = async (phase) => {
    try {
      const handles = await browser.getWindowHandles();
      record(phase, { handles });
      return handles;
    } catch {
      record(phase, { handlesUnavailable: true });
      return [];
    }
  };
  let observations = 0;
  try {
    record("create-requested");
    await (create
      ? create()
      : browser.execute(() =>
          globalThis.__TAURI__.core.invoke("acp_acceptance_control", {
            operation: "other-window",
          }),
        ));
    record("create-completed");
    await browser.waitUntil(async () => {
      const handles = await browser.getWindowHandles();
      // Bound polling diagnostics while retaining the final enumeration.
      if (observations++ < 8 || handles.includes(label))
        record("enumerated", { handles });
      return handles.includes(label);
    });
    record("switch-requested");
    await browser.switchToWindow(label);
    record("switch-completed");
    await browser.waitUntil(() =>
      browser.execute(() => Boolean(globalThis.__TAURI__?.core?.invoke)),
    );
    record("ipc-ready");
  } catch (error) {
    record("failed", { operation: "create-discover-switch-ipc" });
    throw error;
  }
  return async () => {
    await observeHandles("close-enumerated");
    record("close-requested");
    try {
      await browser.closeWindow();
    } catch (error) {
      await observeHandles("close-failed-enumerated");
      record("failed", { operation: "close-secondary" });
      throw error;
    }
    record("close-completed");
    await observeHandles("post-close-enumerated");
    try {
      await browser.switchToWindow("main");
    } catch (error) {
      await observeHandles("restore-failed-enumerated");
      record("failed", { operation: "restore-main" });
      throw error;
    }
    record("main-restored", {
      handles: await observeHandles("main-restored-enumerated"),
    });
  };
}
