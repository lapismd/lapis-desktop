import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("bundled-origin installed modules, workers and WASM share verified native admission", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "plugin-assets-"),
  );
  const vault = join(root, "Plugin asset vault");
  const directory = join(vault, ".lapis/plugins/portable-fixture");
  mkdirSync(directory, { recursive: true });
  const sources = {
    "main.mjs": Buffer.from(
      'import { Plugin } from "@lapis-notes/api"; export { Plugin }; export const marker = "portable-native";',
    ),
    "worker.mjs": Buffer.from('postMessage("native-worker");'),
    "module.wasm": Buffer.from([0, 97, 115, 109, 1, 0, 0, 0]),
  };
  const files = Object.entries(sources).map(([path, bytes]) => {
    writeFileSync(join(directory, path), bytes);
    return { path, size: bytes.length, sha256: digest(bytes) };
  });
  const fingerprint = digest(
    files
      .slice()
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .map((file) => `${file.path}:${file.size}:${file.sha256}`)
      .join("|"),
  );
  const now = new Date(0).toISOString();
  writeFileSync(
    join(vault, ".lapis/installed-plugins.json"),
    JSON.stringify({
      schemaVersion: 1,
      updatedAt: now,
      plugins: {
        "portable-fixture": {
          pluginId: "portable-fixture",
          installedVersion: "1.0.0",
          installedAt: now,
          updatedAt: now,
          provenance: "manual",
          files,
        },
      },
    }),
  );
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession("plugin-assets", root);
  context.after(session.cleanup);
  const result = await session.browser.execute(async (fingerprint) => {
    const selected = await globalThis.__TAURI__.core.invoke("vault_select");
    const base = new URL(
      `/__lapis/plugins/${selected.resourceToken}/portable-fixture/1.0.0/${fingerprint}/`,
      location.href,
    ).href;
    const response = await fetch(base + "module.wasm");
    const result = {
      status: response.status,
      mime: response.headers.get("Content-Type"),
    };
    if (result.mime !== "application/wasm") return result;
    await WebAssembly.compile(await response.arrayBuffer());
    result.wasm = true;
    const module = await import(base + "main.mjs");
    result.module = module.marker;
    result.sharedApi =
      module.Plugin ===
      (
        await import(
          new URL("/plugin-host-lapis-notes-api.js", location.href).href
        )
      ).Plugin;
    result.worker = await new Promise((resolve, reject) => {
      const worker = new Worker(base + "worker.mjs", { type: "module" });
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error("Native worker timed out"));
      }, 5000);
      const stop = () => {
        clearTimeout(timer);
        worker.terminate();
      };
      worker.onmessage = (event) => {
        stop();
        resolve(event.data);
      };
      worker.onerror = (event) => {
        stop();
        reject(new Error(event.message || "Native worker failed"));
      };
    });
    const head = await fetch(base + "module.wasm", { method: "HEAD" });
    result.head = {
      status: head.status,
      length: head.headers.get("Content-Length"),
      bytes: (await head.arrayBuffer()).byteLength,
    };
    await globalThis.__TAURI__.core.invoke("vault_close", {
      sessionId: selected.sessionId,
    });
    result.closed = (await fetch(base + "main.mjs")).status;
    return result;
  }, fingerprint);
  assert.deepEqual(result, {
    status: 200,
    mime: "application/wasm",
    wasm: true,
    module: "portable-native",
    sharedApi: true,
    worker: "native-worker",
    head: { status: 200, length: "8", bytes: 0 },
    closed: 404,
  });
  await session.close();
});
