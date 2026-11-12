/** Observe the complete chunk before retaining only a bounded matching tail. */
export function rendererReadiness() {
  const marker = "lapis-desktop: renderer ready";
  let tail = "";
  let ready = false;
  return (chunk) => {
    const output = tail + chunk.toString();
    ready ||= output.includes(marker);
    tail = output.slice(-(marker.length - 1));
    return ready;
  };
}

/** Attach one bounded driver only to retain state after startup already failed. */
export async function attachStartupDiagnostic(
  browser,
  phase,
  connect,
  report = () => {},
) {
  if (browser || phase !== "listening") return browser;
  try {
    return await connect();
  } catch (error) {
    report(error);
    return undefined;
  }
}

/** One startup budget; a confirmed listener is never polled again. */
export async function waitForNativeReadiness(
  child,
  checkStatus,
  { timeout = 15000, interval = 100, signal, onPhase = () => {} } = {},
) {
  const started = performance.now();
  const controller = new AbortController();
  let phase = "listener";
  let timer;
  let resolveRenderer;
  const renderer = new Promise((resolve) => {
    resolveRenderer = resolve;
  });
  const observe = rendererReadiness();
  const stdout = (chunk) => {
    if (observe(chunk)) {
      resolveRenderer();
      child.stdout.off("data", stdout);
      onPhase("renderer", performance.now() - started);
    }
  };
  const abort = () => controller.abort(signal.reason);
  const failed = new Promise((_, reject) => {
    controller.signal.addEventListener(
      "abort",
      () => reject(controller.signal.reason),
      { once: true },
    );
  });
  // Attach before the first await so even an early marker or process failure latches.
  child.stdout.on("data", stdout);
  const error = (cause) =>
    controller.abort(
      new Error("Native process failed during startup.", { cause }),
    );
  const exit = (code, termination) =>
    controller.abort(
      new Error(
        `Native process exited during startup (code=${code}, signal=${termination}).`,
      ),
    );
  child.once("error", error);
  child.once("exit", exit);
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  if (child.exitCode != null || child.signalCode != null)
    exit(child.exitCode, child.signalCode);
  timer = setTimeout(
    () =>
      controller.abort(
        new Error(`Native startup deadline exhausted while awaiting ${phase}.`),
      ),
    timeout,
  );
  const ready = async () => {
    while (!controller.signal.aborted) {
      let listening = false;
      try {
        listening = await checkStatus(controller.signal);
      } catch (cause) {
        if (controller.signal.aborted) throw controller.signal.reason;
      }
      if (listening) break;
      await new Promise((resolve) => {
        const retry = setTimeout(done, interval);
        function done() {
          clearTimeout(retry);
          controller.signal.removeEventListener("abort", done);
          resolve();
        }
        controller.signal.addEventListener("abort", done, { once: true });
      });
    }
    controller.signal.throwIfAborted();
    onPhase("listening", performance.now() - started);
    phase = "renderer acknowledgement";
    await Promise.race([renderer, failed]);
  };
  try {
    await Promise.race([ready(), failed]);
  } finally {
    clearTimeout(timer);
    child.stdout.off("data", stdout);
    child.off("error", error);
    child.off("exit", exit);
    signal?.removeEventListener("abort", abort);
    // Cancel any in-flight status request or paced delay when another path fails.
    if (!controller.signal.aborted) controller.abort();
  }
}
