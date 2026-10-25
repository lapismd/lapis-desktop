import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { nativeSession } from "./native-session.mjs";
async function invoke(session, command, args = {}) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return { value: await globalThis.__TAURI__.core.invoke(command, args) };
      } catch (error) {
        return {
          failure: {
            code: error?.code,
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
  assert.equal(result.failure, undefined, JSON.stringify(result));
  return result.value;
}
test("selected Core turns use native admission and preserve owner selection through hidden reload", async (context) => {
  const previous = process.env.LAPIS_DESKTOP_AI_OWNER;
  process.env.LAPIS_DESKTOP_AI_OWNER = "core";
  const oldPolicy = process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI;
  process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_AI_OWNER;
    else process.env.LAPIS_DESKTOP_AI_OWNER = previous;
    if (oldPolicy === undefined)
      delete process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI;
    else process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = oldPolicy;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/turn-owner-"));
  const vault = join(root, "Vault");
  mkdirSync(vault);
  const session = await nativeSession("turn-owner", root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  const info = await success(session, "shell_info");
  assert.equal(info.aiOwner, "core");
  assert.equal(info.backgroundApi, true);
  assert.equal(info.nativeVisibility.Ok[0], false);
  assert.equal(info.nativeVisibility.Ok[4], false);
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: { sessionId: "not-admitted", command: { kind: "list" } },
      })
    ).failure,
  );
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const descriptor = await success(session, "vault_select");
  await success(session, "desktop_ai_admit", {
    request: { sessionId: descriptor.sessionId },
  });
  const turn = (command) =>
    success(session, "desktop_ai_turn", {
      request: { sessionId: descriptor.sessionId, command },
    });
  assert.deepEqual(await turn({ kind: "list" }), {
    kind: "records",
    records: [],
  });
  assert.deepEqual(await turn({ kind: "targets" }), {
    kind: "targets",
    targets: [],
  });
  assert.ok(
    (await invoke(session, "plugin:lapis-ai|targets")).failure,
    "Core must reject the former renderer execution path",
  );
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: {
          sessionId: descriptor.sessionId,
          command: { kind: "list" },
          root: "/outside",
        },
      })
    ).failure,
  );
  assert.deepEqual(await turn({ kind: "set_enabled", enabled: false }), {
    kind: "availability",
    enabled: false,
  });
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: {
          sessionId: descriptor.sessionId,
          command: { kind: "targets" },
        },
      })
    ).failure,
  );
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: { sessionId: "another-vault", command: { kind: "list" } },
      })
    ).failure,
  );
  await turn({ kind: "set_enabled", enabled: true });
  await success(session, "desktop_ai_release", { request: { reload: true } });
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: { sessionId: descriptor.sessionId, command: { kind: "list" } },
      })
    ).failure,
  );
  await success(session, "desktop_ai_admit", {
    request: { sessionId: descriptor.sessionId },
  });
  assert.deepEqual(await turn({ kind: "list" }), {
    kind: "records",
    records: [],
  });
  await success(session, "desktop_ai_release", { request: { reload: false } });
  assert.ok(
    (
      await invoke(session, "desktop_ai_turn", {
        request: { sessionId: descriptor.sessionId, command: { kind: "list" } },
      })
    ).failure,
  );
  await success(session, "vault_close", { sessionId: descriptor.sessionId });
  assert.equal(
    (await success(session, "shell_info")).nativeVisibility.Ok[0],
    false,
  );
  await session.close();
});
