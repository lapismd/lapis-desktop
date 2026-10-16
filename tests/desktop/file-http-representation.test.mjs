import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { nativeSession } from "./native-session.mjs";
import { compressedRenderer } from "./file-http-renderer.mjs";
import { run } from "../../scripts/desktop-acceptance.mjs";

test("bundled native resources preserve raw bytes and representation lengths for GET, HEAD and binary IPC", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "raw-representation-"),
  );
  const vault = join(root, "Raw representation vault");
  mkdirSync(vault);
  // Gzip-looking file bytes are not a decoded upstream HTTP response.
  const raw = gzipSync(Buffer.from("café raw representation\n"));
  writeFileSync(join(vault, "raw.png"), raw);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession("raw-representation", root);
  context.after(session.cleanup);
  const result = await session.browser.execute(async () => {
    const { invoke, convertFileSrc } = globalThis.__TAURI__.core;
    const selected = await invoke("vault_select");
    const url = convertFileSrc(
      `${selected.resourceToken}/raw.png`,
      "lapis-vault",
    );
    const response = await fetch(url);
    const head = await fetch(url, { method: "HEAD" });
    const result = {
      status: response.status,
      contentType: response.headers.get("Content-Type"),
      encoding: response.headers.get("Content-Encoding"),
      length: response.headers.get("Content-Length"),
      cache: response.headers.get("Cache-Control"),
      bytes: [...new Uint8Array(await response.arrayBuffer())],
      headStatus: head.status,
      headLength: head.headers.get("Content-Length"),
      headBytes: (await head.arrayBuffer()).byteLength,
      ipcBytes: await invoke("vault_fs", {
        sessionId: selected.sessionId,
        request: { operation: "read-binary", path: "raw.png" },
      }),
    };
    await invoke("vault_close", { sessionId: selected.sessionId });
    return result;
  });
  assert.deepEqual(result, {
    status: 200,
    contentType: "image/png",
    encoding: null,
    length: String(raw.length),
    cache: "no-store",
    bytes: [...raw],
    headStatus: 200,
    headLength: String(raw.length),
    headBytes: 0,
    ipcBytes: [...raw],
  });
  await session.close();
});

test(
  "the actual Tauri development WebView loads gzip application HTML and modules directly without another decoding stage",
  { timeout: 300000 },
  async (context) => {
    const root = mkdtempSync(
      join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "gzip-renderer-"),
    );
    const fixture = await compressedRenderer();
    let session;
    context.after(async () => {
      await session?.cleanup();
      await fixture.close();
    });
    const response = await fetch(fixture.origin);
    const direct = fixture.records.get("/");
    assert.equal(response.status, 201);
    assert.equal(
      response.headers.get("Content-Type"),
      "text/html; charset=utf-8",
    );
    assert.equal(response.headers.get("Content-Encoding"), "gzip");
    assert.equal(
      response.headers.get("Content-Length"),
      direct.headers["Content-Length"],
    );
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("ETag"), direct.headers.ETag);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fixture.html);
    const configuration = JSON.parse(
      readFileSync("src-tauri/tauri.e2e.conf.json", "utf8"),
    );
    await run(
      "cargo",
      [
        "build",
        "--manifest-path",
        "src-tauri/Cargo.toml",
        "--locked",
        "--features",
        "e2e",
      ],
      {
        ...process.env,
        CARGO_BUILD_JOBS: "2",
        TAURI_CONFIG: JSON.stringify(configuration),
      },
    );
    fixture.records.clear();
    session = await nativeSession(
      "gzip-renderer",
      root,
      resolve("src-tauri/target/debug/lapis-desktop"),
    );
    const state = await session.browser.execute(() => ({
      url: location.href,
      ready: document.documentElement.dataset.shellReady,
      contentType: document.contentType,
    }));
    assert.equal(new URL(state.url).origin, fixture.origin);
    assert.equal(state.ready, "true");
    assert.equal(state.contentType, "text/html");
    const navigation = fixture.records.get(new URL(state.url).pathname);
    assert.equal(navigation.status, 201);
    assert.equal(navigation.headers["Content-Encoding"], "gzip");
    assert.equal(navigation.decodedLength, fixture.html.length);
    const modules = [...fixture.records.entries()].filter(([path]) =>
      path.endsWith(".js"),
    );
    assert.ok(
      modules.length > 0,
      "The native WebView requests its real application modules",
    );
    assert.ok(
      modules.every(
        ([, record]) =>
          record.status === 200 &&
          record.headers["Content-Encoding"] === "gzip",
      ),
    );
    await session.close();
  },
);
