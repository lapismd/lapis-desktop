import { spawn, execFileSync } from "node:child_process";
import { createWriteStream, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve, join } from "node:path";
import { remote } from "webdriverio";
import assert from "node:assert/strict";
import { focusNativeWindow } from "./native-visibility.mjs";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";
import { waitForNativeReadiness } from "./native-readiness.mjs";
import {
  nativeSessionMode,
  assertBackgroundAvailability,
} from "./native-session-mode.mjs";

async function availablePort() {
  const server = createServer();
  await new Promise((resolvePort, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePort);
  });
  const port = server.address().port;
  await new Promise((resolveClose) => server.close(resolveClose));
  return port;
}
export async function nativeSession(
  name,
  isolatedRoot,
  executablePath = process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY ??
    resolve(
      "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
    ),
  args = [],
  options = {},
) {
  const mode = nativeSessionMode(options);
  const executable = acceptanceBinary(executablePath, mode.requiredMarkers);
  if (mode.background)
    assertBackgroundAvailability(
      executable,
      execFileSync("/bin/ps", ["-axo", "pid=,comm="], { encoding: "utf8" }),
    );
  const root = isolatedRoot ?? process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
  const port = await availablePort();
  const started = performance.now();
  const child = spawn(executable, args, {
    env: {
      ...mode.environment,
      PATH: "/usr/bin:/bin",
      TAURI_WEBDRIVER_PORT: String(port),
      LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
      LAPIS_DESKTOP_ACCEPTANCE_STATE: isolatedRoot
        ? join(root, "window-state.json")
        : process.env.LAPIS_DESKTOP_ACCEPTANCE_STATE,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const log = createWriteStream(join(root, `${name}.log`));
  log.write(
    JSON.stringify({
      kind: "native-startup",
      session: name,
      pid: child.pid,
      phase: "spawn",
      elapsedMs: Math.round(performance.now() - started),
    }) + "\n",
  );
  const readiness = waitForNativeReadiness(
    child,
    async (signal) => {
      const response = await fetch(`http://127.0.0.1:${port}/status`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(1000)]),
      });
      return response.ok;
    },
    {
      signal: options.signal,
      onPhase: (phase) =>
        log.write(
          JSON.stringify({
            kind: "native-startup",
            session: name,
            pid: child.pid,
            phase,
            elapsedMs: Math.round(performance.now() - started),
          }) + "\n",
        ),
    },
  );
  // Startup can fail before setup reaches its await; keep that rejection handled.
  readiness.catch(() => {});
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const exited = new Promise((resolveExit, reject) => {
    child.once("error", (error) => {
      log.end();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      log.end();
      resolveExit({ code, signal });
    });
  });
  exited.catch(() => {});
  let browser;
  async function cleanup() {
    if (child.exitCode === null && child.signalCode === null) {
      if (browser) {
        let timer;
        try {
          const diagnostic = await Promise.race([
            browser.execute(() => ({
              body: document.body.innerText,
              activeElement: document.activeElement?.outerHTML.slice(0, 2000),
              graphFrames: globalThis.__nativeGraphFrames ?? null,
              taskTransport: globalThis.__lapisTasksAcceptance?.snapshot(),
            })),
            new Promise((resolve) => {
              timer = setTimeout(() => resolve(null), 1500);
            }),
          ]);
          if (diagnostic)
            writeFileSync(
              join(root, `${name}.dom.log`),
              JSON.stringify(diagnostic, null, 2).slice(0, 256 * 1024),
            );
        } catch (error) {
          console.error(
            `Native cleanup diagnostic unavailable: ${name}`,
            error,
          );
        } finally {
          clearTimeout(timer);
        }
      }
      child.kill("SIGTERM");
      const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
      try {
        await exited;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  try {
    await readiness;
    browser = await remote({
      hostname: "127.0.0.1",
      port,
      path: "/",
      logLevel: "error",
      capabilities: { browserName: "tauri", webSocketUrl: false },
      connectionRetryCount: 0,
      connectionRetryTimeout: 10000,
    });
    await browser.waitUntil(
      () =>
        browser.execute(
          () => document.documentElement.dataset.shellReady === "true",
        ),
      { timeout: 10000 },
    );
    log.write(
      JSON.stringify({
        kind: "native-startup",
        session: name,
        pid: child.pid,
        phase: "shell-ready",
        elapsedMs: Math.round(performance.now() - started),
      }) + "\n",
    );
    if (!mode.background) await focusNativeWindow(browser);
    async function requestClose(quit = false) {
      await browser.execute((quit) => {
        setTimeout(() => {
          if (quit) void globalThis.__TAURI__.core.invoke("lifecycle_quit");
          else void globalThis.__TAURI__.window.getCurrentWindow().close();
        }, 100);
        return true;
      }, quit);
    }
    return {
      id: `${name}:${child.pid}`,
      browser,
      cleanup,
      requestClose,
      isRunning: () => child.exitCode === null && child.signalCode === null,
      waitForExit: () => exited,
      async close(quit = false) {
        await requestClose(quit);
        const diagnostic = setTimeout(() => {
          void browser
            .execute(() => document.body.innerText)
            .then(
              (text) => console.error("Native Close still pending:", text),
              () => {},
            );
        }, 8000);
        const timer = setTimeout(() => child.kill("SIGKILL"), 10000);
        const result = await exited;
        clearTimeout(diagnostic);
        clearTimeout(timer);
        assert.deepEqual(
          result,
          { code: 0, signal: null },
          "Native Close must exit normally before forced cleanup.",
        );
        // The embedded server belongs to the now-exited process; no DELETE follows it.
      },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
