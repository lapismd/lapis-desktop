import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { createNativeEditingIntents } from "../../src/lib/native/editing/intents.ts";

async function fixture(context, owner) {
  const previous = process.env.LAPIS_DESKTOP_EDITING_OWNER;
  if (owner === undefined) delete process.env.LAPIS_DESKTOP_EDITING_OWNER;
  else process.env.LAPIS_DESKTOP_EDITING_OWNER = owner;
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_EDITING_OWNER;
    else process.env.LAPIS_DESKTOP_EDITING_OWNER = previous;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/editing-owner-"));
  const vault = join(root, "Editing café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "original");
  const session = await nativeSession("editing-owner", root, undefined, [], {
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
              code: error?.code,
              message: String(error?.message ?? error),
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
    port: createNativeEditingIntents(selected, call),
  };
}

test("renderer editing is the default and forged DOM selection cannot grant native controls", async (context) => {
  const f = await fixture(context);
  assert.equal((await f.call("shell_info")).editingOwner, "renderer");
  await f.session.browser.execute(() => {
    document.documentElement.dataset.editingOwner = "core";
  });
  await assert.rejects(f.port.call({ kind: "list" }), /not selected/);
  await assert.rejects(f.port.read("Note.md"), /not selected/);
  await f.call("vault_close", { sessionId: f.selected.sessionId });
  await f.session.close();
});

test("hidden native editing retains admitted saves, foreign fences and captured detached recovery", async (context) => {
  const f = await fixture(context, "core");
  const shell = await f.call("shell_info");
  assert.equal(shell.editingOwner, "core");
  assert.equal(shell.nativeVisibility.Ok[0], false);
  assert.equal(shell.nativeVisibility.Ok[4], false);
  assert.equal(
    await f.session.browser.execute(() => document.hasFocus()),
    false,
  );
  const foreign = await f.call("vault_open_recent", {
    profileId: f.selected.profileId,
  });
  const other = createNativeEditingIntents(foreign, f.call);
  const editor_id = crypto.randomUUID();
  const acquired = await f.port.call({
    kind: "acquire",
    editor_id,
    path: "Note.md",
  });
  assert.equal(acquired.kind, "state");
  assert.equal(acquired.state.active, true);
  assert.equal((await f.port.read("Note.md")).text, "original");
  assert.equal(await f.port.read("missing.md"), null);
  await assert.rejects(f.port.read("../outside.md"));
  const save = (selected, data, expected) =>
    f.call("vault_fs", {
      sessionId: selected.sessionId,
      request: {
        operation: "write-text-if-unchanged",
        path: "Note.md",
        data,
        expected,
      },
    });
  await assert.rejects(
    save(foreign, "unsafe", "original"),
    (error) => error.code === "EBUSY",
  );
  await save(f.selected, "saved", "original");
  await f.call("vault_close", {
    sessionId: f.selected.sessionId,
    reload: true,
  });
  await assert.rejects(f.port.call({ kind: "list" }));
  const retained = await other.call({ kind: "list" });
  assert.equal(retained.kind, "states");
  assert.equal(retained.states.length, 1);
  assert.equal(retained.states[0].detached, true);
  await assert.rejects(
    other.call({ kind: "discard", editor_id, generation: 9, revision: 0 }),
  );
  assert.equal((await other.call({ kind: "list" })).states.length, 1);
  await other.call({ kind: "discard", editor_id, generation: 1, revision: 0 });
  assert.deepEqual((await other.call({ kind: "list" })).states, []);
  assert.equal(readFileSync(join(f.vault, "Note.md"), "utf8"), "saved");
  await f.call("vault_close", { sessionId: foreign.sessionId });
  await f.session.close();
});
