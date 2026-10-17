import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function invoke(session, command, args) {
  return session.browser.execute(
    async (command, args) => {
      try {
        return { value: await globalThis.__TAURI__.core.invoke(command, args) };
      } catch (error) {
        return {
          failure: {
            message: error?.message ?? String(error),
            code: error?.code ?? null,
          },
        };
      }
    },
    command,
    args,
  );
}
async function admit(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  const result = await invoke(session, "vault_select", { create: false });
  assert.equal(result.failure, undefined);
  assert.ok(result.value.sessionId);
  return result.value.sessionId;
}
function commands(session, sessionId, operation) {
  return invoke(session, "desktop_ai_user_commands", { sessionId, operation });
}

test("native user-wide AI commands preserve existing files, constrain IO and survive restart", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "user-commands-"),
  );
  const one = join(root, "one");
  const two = join(root, "two");
  mkdirSync(one);
  mkdirSync(two);
  const session = await nativeSession("user-commands", root);
  context.after(session.cleanup);
  const first = await admit(session, root, one);
  const directory = join(root, ".lapis/agents/commands");
  const listed = await commands(session, first, { type: "list" });
  assert.equal(
    listed.failure,
    undefined,
    "the named native command-store operation must be registered",
  );
  assert.deepEqual(listed.value, { root: directory, files: [] });
  assert.equal(
    existsSync(directory),
    false,
    "a read must not create user state",
  );
  assert.ok(
    (
      await commands(session, "missing-admission", {
        type: "write",
        name: "blocked",
        content: "blocked",
      })
    ).failure,
  );
  assert.equal(existsSync(directory), false);

  assert.equal(
    (
      await commands(session, first, {
        type: "createIfMissing",
        name: "help",
        content: "# User help 笔记\n",
      })
    ).value,
    true,
  );
  assert.equal(
    (
      await commands(session, first, {
        type: "createIfMissing",
        name: "help",
        content: "default replacement",
      })
    ).value,
    false,
  );
  assert.equal(
    readFileSync(join(directory, "help.md"), "utf8"),
    "# User help 笔记\n",
  );
  const second = await admit(session, root, two);
  assert.equal(
    (await commands(session, second, { type: "exists", name: "help" })).value,
    true,
  );
  assert.equal(
    (
      await commands(session, second, {
        type: "write",
        name: "review",
        content: "Review notes",
      })
    ).failure,
    undefined,
  );
  assert.deepEqual(
    (await commands(session, first, { type: "list" })).value.files.map(
      (file) => file.name,
    ),
    ["help", "review"],
  );

  const outside = join(root, "outside.md");
  writeFileSync(outside, "outside sentinel");
  for (const name of ["../outside", outside, "a/b", "Upper", "a".repeat(65)]) {
    assert.ok(
      (
        await commands(session, second, {
          type: "write",
          name,
          content: "escape",
        })
      ).failure,
    );
  }
  assert.ok(
    (await commands(session, second, { type: "list", directory: root }))
      .failure,
    "renderer directory overrides must reject",
  );
  symlinkSync(outside, join(directory, "alias.md"));
  assert.ok(
    (
      await commands(session, second, {
        type: "write",
        name: "alias",
        content: "escape",
      })
    ).failure,
  );
  assert.equal(readFileSync(outside, "utf8"), "outside sentinel");
  const before = readFileSync(join(directory, "review.md"), "utf8");
  assert.ok(
    (
      await commands(session, second, {
        type: "write",
        name: "review",
        content: "x".repeat(512 * 1024 + 1),
      })
    ).failure,
  );
  assert.equal(readFileSync(join(directory, "review.md"), "utf8"), before);
  chmodSync(join(directory, "review.md"), 0o444);
  assert.match(
    (
      await commands(session, second, {
        type: "write",
        name: "review",
        content: "denied",
      })
    ).failure.message,
    /read-only/i,
  );
  chmodSync(join(directory, "review.md"), 0o600);
  assert.equal(
    (await invoke(session, "vault_close", { sessionId: first })).failure,
    undefined,
  );
  assert.ok((await commands(session, first, { type: "list" })).failure);
  assert.equal(
    (await commands(session, second, { type: "exists", name: "help" })).value,
    true,
  );

  await session.cleanup();
  const restarted = await nativeSession("user-commands-restart", root);
  context.after(restarted.cleanup);
  const restored = await admit(restarted, root, two);
  assert.deepEqual(
    (await commands(restarted, restored, { type: "list" })).value.files,
    [
      { name: "help", content: "# User help 笔记\n" },
      { name: "review", content: "Review notes" },
    ],
  );
});
