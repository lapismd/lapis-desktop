import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
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
            message:
              typeof error === "string"
                ? error
                : String(error?.message ?? error),
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
  assert.equal(
    state.nativeVisibility.Ok[0],
    false,
    "No native window may become visible.",
  );
  assert.equal(
    state.nativeVisibility.Ok[4],
    false,
    "The native window must never own keyboard focus.",
  );
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}
async function select(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  return success(session, "vault_select");
}
const targets = (session) => invoke(session, "plugin:lapis-ai|targets");
const admit = (session, id) =>
  success(session, "desktop_ai_admit", { request: { sessionId: id } });

test("background native admission validates real caller frames, reload scopes, vault closure and cold reset", async (context) => {
  assert.equal(process.platform, "darwin");
  assert.equal(process.arch, "arm64");
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "ai-admission-background-"));
  const one = join(root, "Vault 笔记");
  const two = join(root, "Another vault");
  mkdirSync(one);
  mkdirSync(two);
  const session = await nativeSession(
    "ai-admission-background",
    root,
    undefined,
    [],
    { background: true },
  );
  context.after(session.cleanup);
  await quiet(session);
  assert.ok(
    (await targets(session)).failure,
    "Unadmitted windows have no ACP authority.",
  );
  const first = await select(session, root, one);
  await admit(session, first.sessionId);
  assert.deepEqual(await success(session, "plugin:lapis-ai|targets"), []);
  assert.deepEqual(await success(session, "plugin:lapis-ai|list"), []);
  for (const request of [
    { sessionId: first.sessionId, root: "/outside" },
    { sessionId: first.sessionId, generation: "controller-id" },
    { sessionId: first.sessionId, program: "/usr/bin/true", env: {} },
  ])
    assert.ok((await invoke(session, "desktop_ai_admit", { request })).failure);
  assert.deepEqual(await success(session, "plugin:lapis-ai|targets"), []);
  assert.ok(
    (
      await invoke(session, "plugin:lapis-ai|open", {
        requestId: "no-program",
        targetId: "arbitrary-program",
      })
    ).failure,
  );
  assert.deepEqual(await success(session, "plugin:lapis-ai|list"), []);
  assert.ok(
    (await invoke(session, "acp_acceptance_control", { operation: "enable" }))
      .failure,
  );

  await success(session, "desktop_ai_release", { request: { reload: true } });
  assert.ok((await targets(session)).failure);
  await success(session, "vault_close", { sessionId: first.sessionId });
  const restored = await select(session, root, one);
  assert.notEqual(restored.sessionId, first.sessionId);
  await admit(session, restored.sessionId);
  assert.deepEqual(await success(session, "plugin:lapis-ai|targets"), []);

  const { connectionId } = await success(session, "vault_db_open", {
    sessionId: restored.sessionId,
  });
  const blocked = await invoke(session, "vault_close", {
    sessionId: restored.sessionId,
  });
  assert.equal(blocked.failure.code, "EBUSY");
  assert.deepEqual(
    await success(session, "plugin:lapis-ai|targets"),
    [],
    "Blocked closure retains its authority.",
  );
  await success(session, "vault_db_close", {
    sessionId: restored.sessionId,
    connectionId,
  });

  const second = await select(session, root, two);
  await admit(session, second.sessionId);
  await success(session, "vault_close", { sessionId: restored.sessionId });
  assert.deepEqual(
    await success(session, "plugin:lapis-ai|targets"),
    [],
    "Closing the previous vault cannot revoke the new scope.",
  );
  await success(session, "desktop_ai_release", { request: { reload: false } });
  assert.ok((await targets(session)).failure);
  await admit(session, second.sessionId);
  const parked = join(root, "Replaced vault");
  renameSync(two, parked);
  mkdirSync(two);
  assert.ok(
    (await targets(session)).failure,
    "Physical root replacement revokes authority.",
  );
  const replacement = await select(session, root, two);
  await admit(session, replacement.sessionId);
  assert.deepEqual(await success(session, "plugin:lapis-ai|targets"), []);
  await success(session, "vault_close", { sessionId: replacement.sessionId });
  assert.ok((await targets(session)).failure);
  await quiet(session);
  await session.close(true);

  const cold = await nativeSession("ai-admission-cold", root, undefined, [], {
    background: true,
  });
  context.after(cold.cleanup);
  await quiet(cold);
  assert.ok(
    (await targets(cold)).failure,
    "No admission survives process restart.",
  );
  const next = await select(cold, root, one);
  await admit(cold, next.sessionId);
  assert.deepEqual(await success(cold, "plugin:lapis-ai|targets"), []);
  await quiet(cold);
  await cold.close(true);
  // All paths are inside the explicitly owned isolated fixture.
  rmSync(parked, { recursive: true });
  console.log(`Background native admission evidence: ${root}`);
});
