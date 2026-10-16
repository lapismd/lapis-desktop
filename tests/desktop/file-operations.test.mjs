import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

test("native admitted mutations preserve collisions, bytes and revoked authority", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "files-"),
  );
  const vault = join(root, "Files café");
  mkdirSync(vault);
  writeFileSync(join(vault, "café.md"), "# Native mutations\n");
  writeFileSync(join(vault, "keep.md"), "# Preserve destination\n");
  const session = await nativeSession("mutations", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const result = await session.browser.execute(async () => {
    const { invoke } = globalThis.__TAURI__.core;
    const selected = await invoke("vault_select", {});
    const run = (request) =>
      invoke("vault_fs", { sessionId: selected.sessionId, request });
    await run({ operation: "mkdir", path: "Archive", recursive: false });
    await run({
      operation: "rename",
      path: "café.md",
      newPath: "Archive/笔记.md",
    });
    await run({
      operation: "copy",
      path: "Archive/笔记.md",
      newPath: "copy.md",
    });
    const errors = {};
    for (const [name, request] of [
      ["rename", { operation: "rename", path: "copy.md", newPath: "keep.md" }],
      ["copy", { operation: "copy", path: "copy.md", newPath: "keep.md" }],
      ["directory", { operation: "remove", path: "Archive" }],
      ["nonempty", { operation: "rmdir", path: "Archive", recursive: false }],
      [
        "escape",
        { operation: "rename", path: "copy.md", newPath: "../outside.md" },
      ],
    ]) {
      try {
        await run(request);
        errors[name] = "unexpected success";
      } catch (error) {
        errors[name] = error.code;
      }
    }
    await run({ operation: "remove", path: "Archive/笔记.md" });
    await run({ operation: "rmdir", path: "Archive", recursive: false });
    await invoke("vault_close", { sessionId: selected.sessionId });
    try {
      await run({ operation: "remove", path: "copy.md" });
      errors.revoked = "unexpected success";
    } catch (error) {
      errors.revoked = error.code;
    }
    return errors;
  });
  assert.deepEqual(result, {
    rename: "EEXIST",
    copy: "EEXIST",
    directory: "EISDIR",
    nonempty: "ENOTEMPTY",
    escape: "EINVAL",
    revoked: "EACCES",
  });
  assert.equal(
    readFileSync(join(vault, "copy.md"), "utf8"),
    "# Native mutations\n",
  );
  assert.equal(
    readFileSync(join(vault, "keep.md"), "utf8"),
    "# Preserve destination\n",
  );
  assert.equal(existsSync(join(vault, "café.md")), false);
  assert.equal(existsSync(join(vault, "Archive")), false);
  await session.close();
});
