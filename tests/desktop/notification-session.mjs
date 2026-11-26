// Minimal execution-only WebDriver client for the isolated OS notification lane.
// It needs no host package installation and never builds a native application.
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import assert from "node:assert/strict";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";
import { nativeApplicationArgs } from "./native-session-mode.mjs";
import { waitForNativeReadiness } from "./native-readiness.mjs";

export async function notificationSession(name, root, path) {
  const binary = acceptanceBinary(path);
  const listener = createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const child = spawn(binary, nativeApplicationArgs(binary, []), {
    env: {
      PATH: "/usr/bin:/bin",
      TAURI_WEBDRIVER_PORT: String(port),
      LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
      LAPIS_DESKTOP_ACCEPTANCE_STATE: join(root, "window-state.json"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const log = createWriteStream(join(root, `${name}.log`));
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      log.end();
      resolve({ code, signal });
    });
  });
  exited.catch(() => {});
  const origin = `http://127.0.0.1:${port}`;
  async function request(route, body, timeout = 10000) {
    const response = await fetch(origin + route, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    const result = await response.json();
    if (!response.ok || result.value?.error)
      throw Error(result.value?.message ?? "Native WebDriver request failed");
    return result.value;
  }
  let id;
  const execute = (fn, ...args) =>
    request(
      `/session/${id}/execute/sync`,
      { script: `return (${fn.toString()})(...arguments)`, args },
      120000,
    );
  async function cleanup() {
    if (child.exitCode === null && child.signalCode === null) {
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
    await waitForNativeReadiness(child, async (signal) => {
      const response = await fetch(origin + "/status", {
        signal: AbortSignal.any([signal, AbortSignal.timeout(1000)]),
      });
      return response.ok;
    });
    const session = await request("/session", {
      capabilities: {
        alwaysMatch: { browserName: "tauri", webSocketUrl: false },
      },
    });
    assert.equal(typeof session.sessionId, "string");
    id = session.sessionId;
    const end = Date.now() + 10000;
    while (
      !(await execute(
        () => document.documentElement.dataset.shellReady === "true",
      ))
    ) {
      assert.ok(Date.now() < end, "Native shell readiness expired");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await execute(() =>
      globalThis.__TAURI__.window.getCurrentWindow().setFocus(),
    );
    return {
      browser: { execute },
      cleanup,
      async close() {
        await execute(() => {
          setTimeout(
            () => void globalThis.__TAURI__.core.invoke("lifecycle_quit"),
            100,
          );
          return true;
        });
        const timer = setTimeout(() => child.kill("SIGKILL"), 10000);
        try {
          assert.deepEqual(await exited, { code: 0, signal: null });
        } finally {
          clearTimeout(timer);
        }
      },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
