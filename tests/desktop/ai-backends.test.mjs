import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function invoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return {
          value: await globalThis.__TAURI__.core.invoke(command, args),
          failure: null,
        };
      } catch (error) {
        return {
          value: null,
          failure: {
            code: error?.code ?? null,
            message: String(error?.message ?? error),
          },
        };
      }
    },
    command,
    args,
  );
}
async function success(session, command, args = {}) {
  const result = await invoke(session, command, args);
  assert.equal(
    result.failure,
    null,
    `${command}: ${JSON.stringify(result.failure)}`,
  );
  return result.value;
}
async function quiet(session) {
  const state = await success(session, "shell_info");
  assert.equal(state.backgroundApi, true);
  assert.equal(state.nativeVisibility.Ok[0], false);
  assert.equal(state.nativeVisibility.Ok[4], false);
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}
async function selectVault(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  return success(session, "vault_select");
}
function frame(vault, operation) {
  return JSON.stringify({ version: 1, sessionId: vault.sessionId, operation });
}
function call(session, vault, operation) {
  return invoke(session, "desktop_ai_backends", {
    request: frame(vault, operation),
  });
}
async function backend(session, vault, operation) {
  const result = await call(session, vault, operation);
  assert.equal(result.failure, null, JSON.stringify(result.failure));
  const reply = JSON.parse(result.value);
  assert.equal(reply.version, 1);
  return reply.data;
}
const id = (n) => n.toString(16).padStart(2, "0").repeat(16);
const open = (n) => ({ type: "open", requestId: id(n) });
const select = (n, revision, backend = "jj") => ({
  type: "select",
  requestId: id(n),
  expectedRevision: revision,
  backend,
});
const admit = (session, vault) =>
  success(session, "desktop_ai_admit", {
    request: { sessionId: vault.sessionId },
  });
const release = (session, reload) =>
  success(session, "desktop_ai_release", { request: { reload } });
function digest(root) {
  const files = [];
  function walk(at) {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else
        files.push([
          path.slice(root.length),
          createHash("sha256").update(readFileSync(path)).digest("hex"),
        ]);
    }
  }
  walk(root);
  return files.sort((a, b) => a[0].localeCompare(b[0]));
}

test("hidden native backend choices retain receipts and exact owners through reload, close, replacement and cold restart", async (context) => {
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "ai-backends-background-"));
  const vaultPath = join(root, "Vault 笔记");
  const plainPath = join(root, "Plain folder");
  mkdirSync(vaultPath);
  mkdirSync(plainPath);
  execFileSync(
    "/opt/homebrew/bin/jj",
    [
      "--no-pager",
      "--config",
      "user.name='Fixture'",
      "--config",
      "user.email='fixture@invalid'",
      "git",
      "init",
      "--no-colocate",
    ],
    {
      cwd: vaultPath,
      env: {
        ...process.env,
        JJ_CONFIG: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
      },
      stdio: "pipe",
    },
  );
  writeFileSync(join(vaultPath, "note.md"), "Retain this unsnapshotted note\n");
  const before = digest(vaultPath);
  const session = await nativeSession(
    "ai-backends-background",
    root,
    undefined,
    [],
    { background: true },
  );
  context.after(session.cleanup);
  await quiet(session);
  const vault = await selectVault(session, root, vaultPath);
  assert.ok((await call(session, vault, { type: "read" })).failure);
  await admit(session, vault);
  assert.deepEqual(await backend(session, vault, { type: "read" }), {
    type: "selection",
    data: { backend: "vault-files", revision: 0 },
  });
  for (const extra of [
    "window",
    "url",
    "root",
    "generation",
    "metadata",
    "cache",
  ]) {
    const bad = {
      version: 1,
      sessionId: vault.sessionId,
      operation: { type: "read" },
      [extra]: "outside",
    };
    assert.ok(
      (
        await invoke(session, "desktop_ai_backends", {
          request: JSON.stringify(bad),
        })
      ).failure,
    );
  }
  assert.ok(
    (
      await invoke(session, "desktop_ai_backends", {
        request: " ".repeat(4097),
      })
    ).failure,
  );
  const receipt = await backend(session, vault, select(1, 0));
  assert.equal(receipt.data.selection.backend, "jj");
  const first = await backend(session, vault, open(2));
  assert.deepEqual(await backend(session, vault, open(2)), first);
  assert.equal(
    (await call(session, vault, select(3, 1, "vault-files"))).failure.code,
    "EBUSY",
  );
  assert.deepEqual(
    await backend(session, vault, { type: "status", requestId: id(1) }),
    receipt,
  );
  const db = await success(session, "vault_db_open", {
    sessionId: vault.sessionId,
  });
  assert.equal(
    (await invoke(session, "vault_close", { sessionId: vault.sessionId }))
      .failure.code,
    "EBUSY",
  );
  assert.deepEqual(await backend(session, vault, open(2)), first);
  await success(session, "vault_db_close", {
    sessionId: vault.sessionId,
    connectionId: db.connectionId,
  });
  await release(session, true);
  assert.ok((await call(session, vault, open(4))).failure);
  await session.browser.refresh();
  await session.browser.waitUntil(
    () => session.browser.execute(() => Boolean(globalThis.__TAURI__)),
    { timeout: 10000 },
  );
  await admit(session, vault);
  const reattached = await backend(session, vault, open(4));
  assert.notEqual(reattached.data.handle, first.data.handle);
  assert.ok(
    (await call(session, vault, { type: "close", handle: first.data.handle }))
      .failure,
  );
  assert.deepEqual(await backend(session, vault, open(4)), reattached);
  await release(session, false);
  await admit(session, vault);
  assert.deepEqual(await backend(session, vault, select(3, 1, "vault-files")), {
    type: "receipt",
    data: {
      request_id: id(3),
      expected_revision: 1,
      selection: { backend: "vault-files", revision: 2 },
    },
  });
  assert.deepEqual(
    await backend(session, vault, { type: "status", requestId: id(1) }),
    receipt,
  );
  await backend(session, vault, select(5, 2));
  await backend(session, vault, open(6));
  const plain = await selectVault(session, root, plainPath);
  await admit(session, plain);
  assert.ok(
    (await call(session, vault, { type: "read" })).failure,
    "Stale vault frames cannot use a new admission",
  );
  assert.ok((await call(session, plain, select(7, 0))).failure);
  assert.equal(
    (await backend(session, plain, { type: "read" })).data.backend,
    "vault-files",
  );
  const plainOwner = await backend(session, plain, open(9));
  await success(session, "vault_close", { sessionId: vault.sessionId });
  assert.equal(
    (await backend(session, plain, { type: "read" })).data.revision,
    0,
  );
  assert.deepEqual(await backend(session, plain, open(9)), plainOwner);
  await release(session, false);
  assert.deepEqual(
    digest(vaultPath),
    before,
    "Selection and ownership cannot initialize companion metadata or snapshot the source",
  );
  await quiet(session);
  await session.close(true);
  const cold = await nativeSession("ai-backends-cold", root, undefined, [], {
    background: true,
  });
  context.after(cold.cleanup);
  await quiet(cold);
  assert.ok((await call(cold, vault, { type: "read" })).failure);
  const restored = await selectVault(cold, root, vaultPath);
  await admit(cold, restored);
  assert.deepEqual((await backend(cold, restored, { type: "read" })).data, {
    backend: "jj",
    revision: 3,
  });
  assert.deepEqual(
    await backend(cold, restored, { type: "status", requestId: id(1) }),
    receipt,
  );
  const fresh = await backend(cold, restored, open(8));
  assert.notEqual(fresh.data.handle, first.data.handle);
  assert.deepEqual(await success(cold, "plugin:lapis-ai|targets"), []);
  await Promise.all([call(cold, restored, open(8)), release(cold, false)]);
  assert.ok((await call(cold, restored, { type: "read" })).failure);
  await admit(cold, restored);
  const replacement = await backend(cold, restored, open(10));
  assert.notEqual(replacement.data.handle, fresh.data.handle);
  assert.ok(
    (await call(cold, restored, { type: "close", handle: fresh.data.handle }))
      .failure,
  );
  await success(cold, "vault_close", { sessionId: restored.sessionId });
  assert.ok((await call(cold, restored, { type: "read" })).failure);
  assert.deepEqual(digest(vaultPath), before);
  await quiet(cold);
  await cold.close(true);
  console.log(`Background backend ownership evidence: ${root}`);
});
