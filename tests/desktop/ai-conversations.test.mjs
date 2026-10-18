import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const id = (n) => n.toString(16).padStart(2, "0").repeat(16);
async function invoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return {
          value: await globalThis.__TAURI__.core.invoke(command, args),
          failure: null,
        };
      } catch (error) {
        return { value: null, failure: String(error?.message ?? error) };
      }
    },
    command,
    args,
  );
}
async function success(session, command, args = {}) {
  const result = await invoke(session, command, args);
  assert.equal(result.failure, null, `${command}: ${result.failure}`);
  return result.value;
}
const call = (session, vault, operation) =>
  invoke(session, "desktop_ai_backends", {
    request: JSON.stringify({
      version: 1,
      sessionId: vault.sessionId,
      operation,
    }),
  });
async function backend(session, vault, operation) {
  const result = await call(session, vault, operation);
  assert.equal(result.failure, null, result.failure);
  const reply = JSON.parse(result.value);
  assert.equal(reply.version, 1);
  return reply.data;
}
async function admit(session, root, vaultPath) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vaultPath));
  const vault = await success(session, "vault_select");
  await success(session, "desktop_ai_admit", {
    request: { sessionId: vault.sessionId },
  });
  return vault;
}
async function quiet(session) {
  const state = await success(session, "shell_info");
  assert.equal(state.backgroundApi, true);
  assert.equal(state.nativeVisibility.Ok[0], false);
  assert.equal(state.nativeVisibility.Ok[4], false);
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}
function jj(vault, args) {
  return execFileSync("/opt/homebrew/bin/jj", ["--no-pager", ...args], {
    cwd: vault,
    env: {
      ...process.env,
      JJ_CONFIG: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
    },
    encoding: "utf8",
    stdio: "pipe",
  });
}

test("hidden ordinary native command prepares a JJ conversation and recovers its exact receipt after cold restart", async (context) => {
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "ai-conversations-background-"));
  const vaultPath = join(root, "Notes 笔记");
  mkdirSync(vaultPath);
  jj(vaultPath, ["git", "init", "--no-colocate"]);
  writeFileSync(join(vaultPath, "note.md"), "Keep these unsnapshotted notes\n");
  const operation = jj(vaultPath, [
    "--ignore-working-copy",
    "op",
    "log",
    "--limit",
    "1",
    "-T",
    "id",
  ]);
  const first = await nativeSession(
    "ai-conversations-background",
    root,
    undefined,
    [],
    { background: true },
  );
  context.after(first.cleanup);
  await quiet(first);
  const vault = await admit(first, root, vaultPath);
  await backend(first, vault, {
    type: "select",
    requestId: id(1),
    expectedRevision: 0,
    backend: "jj",
  });
  const opened = await backend(first, vault, {
    type: "open",
    requestId: id(2),
  });
  const request = {
    type: "prepareConversation",
    handle: opened.data.handle,
    requestId: id(3),
    title: "Native Notes conversation",
  };
  const prepared = await backend(first, vault, request);
  assert.equal(prepared.type, "conversation");
  assert.match(prepared.data.threadId, /^[a-f0-9]{32}$/);
  assert.match(prepared.data.conversationId, /^[a-f0-9-]{36}$/);
  const receipt = JSON.parse(prepared.data.receipt);
  assert.equal(receipt.repository, prepared.data.repository);
  assert.equal(receipt.request_id, id(3));
  assert.equal(receipt.result.result.thread_id, prepared.data.threadId);
  const stateRef = join(vaultPath, ".jj/repo/store/git/refs/lapis/state/v1");
  const companion = readFileSync(stateRef, "utf8");
  assert.match(companion.trim(), /^[a-f0-9]{40}$/);
  assert.deepEqual(await backend(first, vault, request), prepared);
  assert.equal(readFileSync(stateRef, "utf8"), companion);
  const captureRequest = {
    type: "prepareCapture",
    handle: opened.data.handle,
    requestId: id(10),
    conversationRequestId: id(3),
  };
  const capture = await backend(first, vault, captureRequest);
  assert.equal(capture.type, "capture");
  assert.match(capture.data.targetId, /^[a-f0-9-]{36}$/);
  assert.equal(capture.data.requestId, id(10));
  assert.equal(capture.data.conversationRequestId, id(3));
  assert.deepEqual(await backend(first, vault, captureRequest), capture);
  assert.ok(
    (
      await call(first, vault, {
        ...captureRequest,
        conversationRequestId: id(9),
      })
    ).failure,
  );
  assert.ok(
    (await call(first, vault, { ...captureRequest, root: vaultPath })).failure,
  );
  assert.equal(readFileSync(stateRef, "utf8"), companion);
  assert.ok(
    (
      await call(first, vault, {
        ...request,
        title: "Different original intent",
      })
    ).failure,
  );
  assert.deepEqual(await success(first, "plugin:lapis-ai|targets"), []);
  await success(first, "vault_close", { sessionId: vault.sessionId });
  await quiet(first);
  await first.close(true);

  const cold = await nativeSession(
    "ai-conversations-cold",
    root,
    undefined,
    [],
    { background: true },
  );
  context.after(cold.cleanup);
  await quiet(cold);
  const restored = await admit(cold, root, vaultPath);
  const fresh = await backend(cold, restored, {
    type: "open",
    requestId: id(4),
  });
  assert.notEqual(fresh.data.handle, opened.data.handle);
  const recovery = {
    type: "conversationStatus",
    handle: fresh.data.handle,
    requestId: id(3),
  };
  assert.deepEqual(await backend(cold, restored, recovery), prepared);
  assert.deepEqual(
    await backend(cold, restored, { ...request, handle: fresh.data.handle }),
    prepared,
  );
  const renewedCapture = await backend(cold, restored, {
    ...captureRequest,
    handle: fresh.data.handle,
  });
  assert.notEqual(renewedCapture.data.targetId, capture.data.targetId);
  assert.equal(renewedCapture.data.conversationRequestId, id(3));
  assert.ok((await call(cold, restored, captureRequest)).failure);
  assert.ok((await call(cold, restored, request)).failure);
  assert.equal(readFileSync(stateRef, "utf8"), companion);
  assert.equal(
    readFileSync(join(vaultPath, "note.md"), "utf8"),
    "Keep these unsnapshotted notes\n",
  );
  assert.equal(
    jj(vaultPath, [
      "--ignore-working-copy",
      "op",
      "log",
      "--limit",
      "1",
      "-T",
      "id",
    ]),
    operation,
  );
  assert.deepEqual(await success(cold, "plugin:lapis-ai|targets"), []);
  await success(cold, "vault_close", { sessionId: restored.sessionId });
  await quiet(cold);
  await cold.close(true);
  console.log(`Native conversation preparation evidence: ${root}`);
});
