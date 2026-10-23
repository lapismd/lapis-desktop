import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  symlinkSync,
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
  const reply = await invoke(session, command, args);
  assert.equal(
    reply.failure,
    null,
    `${command}: ${JSON.stringify(reply.failure)}`,
  );
  return reply.value;
}
test("shared file service preserves original native frames, errors and admission without showing a window", async (context) => {
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/core-files-"));
  const vault = join(root, "Notes café 笔记");
  mkdirSync(vault);
  const session = await nativeSession("core-files", root, undefined, [], {
    background: true,
  });
  context.after(() => session.cleanup());
  const quiet = async () => {
    const info = await success(session, "shell_info");
    assert.equal(info.backgroundApi, true);
    assert.equal(info.nativeVisibility.Ok[0], false);
    assert.equal(info.nativeVisibility.Ok[4], false);
    assert.equal(
      await session.browser.execute(() => document.hasFocus()),
      false,
    );
  };
  await quiet();
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const first = await success(session, "vault_select");
  const second = await success(session, "vault_open_recent", {
    profileId: first.profileId,
  });
  assert.equal(first.profileId, second.profileId);
  assert.notEqual(first.sessionId, second.sessionId);
  const fs = (request, selected = first) =>
    success(session, "vault_fs", { sessionId: selected.sessionId, request });
  const refuses = async (request, code, selected = first) => {
    const reply = await invoke(session, "vault_fs", {
      sessionId: selected.sessionId,
      request,
    });
    assert.equal(reply.failure?.code, code, JSON.stringify(reply));
  };
  await fs({ operation: "mkdir", path: ".lapis", recursive: true });
  await fs({
    operation: "write-text",
    path: ".lapis/app.json",
    data: '{"native":true}',
  });
  await fs({
    operation: "create-file",
    path: "é.md",
    data: [...Buffer.from("# 💎\n")],
  });
  assert.equal(
    await fs({ operation: "read-text", path: "é.md" }, second),
    "# 💎\n",
  );
  await fs({ operation: "append-text", path: "é.md", data: "next" });
  await fs(
    {
      operation: "write-text-if-unchanged",
      path: "é.md",
      expected: "# 💎\nnext",
      data: "saved",
      options: { mtime: 1700000000000 },
    },
    second,
  );
  assert.equal(
    (await fs({ operation: "stat", path: "é.md" })).mtime,
    1700000000000,
  );
  await fs({
    operation: "write-binary",
    path: "data.bin",
    data: [0, 255, 128, 42],
  });
  assert.deepEqual(
    await fs({ operation: "read-binary", path: "data.bin" }),
    [0, 255, 128, 42],
  );
  assert.deepEqual(
    await fs({
      operation: "read-range",
      path: "data.bin",
      offset: 1,
      length: 2,
    }),
    [255, 128],
  );
  await fs({ operation: "copy", path: "é.md", newPath: "copy.md" });
  await fs({ operation: "rename", path: "copy.md", newPath: "renamed.md" });
  assert.equal(await fs({ operation: "exists", path: "renamed.md" }), true);
  assert.ok(
    (await fs({ operation: "list", path: "" })).files.includes("renamed.md"),
  );
  await refuses(
    { operation: "copy", path: "é.md", newPath: "renamed.md" },
    "EEXIST",
  );
  await refuses({ operation: "create-file", path: "é.md", data: [] }, "EEXIST");
  await refuses(
    {
      operation: "write-text-if-unchanged",
      path: "é.md",
      expected: "old",
      data: "unsafe",
    },
    "ECONFLICT",
  );
  await refuses({ operation: "rmdir", path: ".lapis" }, "ENOTEMPTY");
  await refuses(
    { operation: "read-range", path: "data.bin", offset: 0, length: 262145 },
    "EINVAL",
  );
  await refuses({ operation: "read-text", path: "../outside" }, "EINVAL");
  symlinkSync("é.md", join(vault, "alias.md"));
  await refuses({ operation: "read-text", path: "alias.md" }, "EACCES");
  writeFileSync(join(vault, "é.md"), "external");
  await refuses(
    {
      operation: "write-text-if-unchanged",
      path: "é.md",
      expected: "saved",
      data: "unsafe",
    },
    "ECONFLICT",
  );
  assert.equal(readFileSync(join(vault, "é.md"), "utf8"), "external");
  await fs({ operation: "remove", path: "renamed.md" });
  await fs({ operation: "rmdir", path: ".lapis", recursive: true });
  await success(session, "vault_close", { sessionId: first.sessionId });
  await refuses({ operation: "read-text", path: "é.md" }, "EACCES");
  assert.equal(
    await fs({ operation: "read-text", path: "é.md" }, second),
    "external",
  );
  await success(session, "vault_close", { sessionId: second.sessionId });
  const reopened = await success(session, "vault_open_recent", {
    profileId: first.profileId,
  });
  assert.equal(
    await fs({ operation: "read-text", path: "é.md" }, reopened),
    "external",
  );
  await success(session, "vault_close", { sessionId: reopened.sessionId });
  await quiet();
});
