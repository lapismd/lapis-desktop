import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { createServer } from "node:net";
import { resolve, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { remote } from "webdriverio";
import assert from "node:assert/strict";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";

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
export async function nativeSession(name, isolatedRoot) {
  const root = isolatedRoot ?? process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
  const port = await availablePort();
  const child = spawn(
    acceptanceBinary(resolve("src-tauri/target/debug/lapis-desktop")),
    [],
    {
      env: {
        ...process.env,
        PATH: "/usr/bin:/bin",
        TAURI_WEBDRIVER_PORT: String(port),
        LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
        LAPIS_DESKTOP_ACCEPTANCE_STATE: isolatedRoot
          ? join(root, "window-state.json")
          : process.env.LAPIS_DESKTOP_ACCEPTANCE_STATE,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const log = createWriteStream(join(root, `${name}.log`));
  let rendererReady = false;
  let outputTail = "";
  child.stdout.on("data", (chunk) => {
    outputTail = (outputTail + chunk.toString()).slice(-512);
    rendererReady ||= outputTail.includes("lapis-desktop: renderer ready");
  });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const exited = new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      log.end();
      resolveExit({ code, signal });
    });
  });
  let browser;
  async function cleanup() {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
      await exited;
      clearTimeout(timer);
    }
  }
  try {
    const deadline = Date.now() + 15000;
    let listening = false;
    while ((!listening || !rendererReady) && Date.now() < deadline) {
      if (child.exitCode !== null)
        throw new Error("Native process exited before WebDriver readiness.");
      try {
        const response = await fetch(`http://127.0.0.1:${port}/status`, {
          signal: AbortSignal.timeout(1000),
        });
        listening = response.ok;
      } catch {
        await delay(100);
      }
    }
    assert.equal(listening, true, "Native WebDriver server must start.");
    assert.equal(
      rendererReady,
      true,
      "Rust must acknowledge the renderer before driver evaluation.",
    );
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
      browser,
      cleanup,
      requestClose,
      isRunning: () => child.exitCode === null && child.signalCode === null,
      async close(quit = false) {
        await requestClose(quit);
        const timer = setTimeout(() => child.kill("SIGKILL"), 10000);
        const result = await exited;
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
