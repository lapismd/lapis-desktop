import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { createNativeTasks } from "../../src/lib/native/tasks/tasks.ts";

const initial =
  "---\ntype: task\nid: read\ntask:\n  status: open\n  inbox: false\n  start: anytime\n---\n\n# Read\n";
const configuration = {
  day_parts: { afternoonStartsAt: "12:00", eveningStartsAt: "17:00" },
  daily: { folder: "daily", date_format: "yyyy-LL-dd" },
  format: { locale: "en-GB", firstDay: 1, minimalDays: 4 },
  provider: { kind: "default" },
};
async function fixture(context, core) {
  for (const key of [
    "LAPIS_DESKTOP_TASKS_OWNER",
    "LAPIS_DESKTOP_METADATA_OWNER",
    "LAPIS_DESKTOP_EDITING_OWNER",
  ]) {
    const previous = process.env[key];
    if (core) process.env[key] = "core";
    else delete process.env[key];
    context.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/tasks-owner-"));
  const vault = join(root, "Tasks café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Task.md"), initial);
  const session = await nativeSession("tasks-owner", root, undefined, [], {
    background: true,
  });
  context.after(session.cleanup);
  const call = async (command, args = {}) => {
    const reply = await session.browser.execute(
      async (command, args) => {
        try {
          return {
            value: await globalThis.__TAURI__.core.invoke(command, args),
          };
        } catch (error) {
          return {
            failure: {
              message: String(error?.message ?? error),
              code: error?.code,
            },
          };
        }
      },
      command,
      args,
    );
    if (reply.failure)
      throw Object.assign(new Error(reply.failure.message), {
        code: reply.failure.code,
      });
    return reply.value;
  };
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await call("vault_select");
  return {
    root,
    vault,
    session,
    call,
    selected,
    tasks: createNativeTasks(selected, call),
  };
}

test("native Tasks remain unavailable by default even if the renderer forges its selection", async (context) => {
  const f = await fixture(context, false);
  assert.equal((await f.call("shell_info")).tasksOwner, "renderer");
  await f.session.browser.execute(() => {
    document.documentElement.dataset.tasksOwner = "core";
  });
  await assert.rejects(
    f.tasks.call({ kind: "status" }),
    (error) => error.code === "ENOTSUP",
  );
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
});

test("native Task transport shares editing fences, typed recovery and revoked vault admission", async (context) => {
  const f = await fixture(context, true);
  const info = await f.call("shell_info");
  assert.equal(info.tasksOwner, "core");
  assert.equal(info.metadataOwner, "core");
  assert.equal(info.editingOwner, "core");
  assert.equal(info.nativeVisibility.Ok[0], false);
  assert.equal(
    await f.session.browser.execute(() => document.hasFocus()),
    false,
  );
  assert.equal((await f.tasks.call({ kind: "status" })).status.enabled, false);
  await f.tasks.call({ kind: "configure", configuration });
  const snapshot = await f.call("vault_editing_snapshot", {
    sessionId: f.selected.sessionId,
    path: "Task.md",
  });
  const editor_id = crypto.randomUUID();
  const intent = (command) =>
    f.call("vault_editing_intents", {
      sessionId: f.selected.sessionId,
      command,
    });
  await intent({ kind: "acquire", editor_id, path: "Task.md" });
  await intent({ kind: "changed", editor_id, generation: 1, revision: 1 });
  const command = {
    kind: "mutate",
    path: "Task.md",
    expected_version: snapshot.version,
    mutation: { type: "cancel", at: "2026-10-26T12:00:00Z" },
  };
  const blocked = await f.tasks.call(command);
  assert.equal(blocked.kind, "failure");
  assert.equal(blocked.failure.code, "BUSY");
  assert.equal(readFileSync(join(f.vault, "Task.md"), "utf8"), initial);
  await intent({ kind: "discard", editor_id, generation: 1, revision: 1 });
  assert.equal((await f.tasks.call(command)).kind, "snapshot");
  assert.equal((await f.tasks.call(command)).failure.code, "CONFLICT");
  const saved = readFileSync(join(f.vault, "Task.md"), "utf8");
  assert.match(saved, /canceled/);
  assert.equal(
    (await f.tasks.call({ kind: "inspect", request_id: crypto.randomUUID() }))
      .operation,
    null,
  );
  await f.tasks.call({ kind: "disable" });
  assert.equal((await f.tasks.call({ kind: "status" })).status.enabled, false);
  assert.equal(readFileSync(join(f.vault, "Task.md"), "utf8"), saved);
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await assert.rejects(
    f.tasks.call({ kind: "status" }),
    (error) => error.code === "EACCES",
  );
  await f.session.close();
});
