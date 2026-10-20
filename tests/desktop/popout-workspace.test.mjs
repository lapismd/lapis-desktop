import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
import { runPopoutProcess } from "./popout-process.mjs";

test("ordinary native workspace popouts retain editors, protect saves, redock and release resources", async () => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "popout-session-"),
  );
  const vault = join(root, "Vault café 笔记");
  mkdirSync(vault);
  const original = "# Original note\n";
  writeFileSync(join(vault, "Note.md"), original);
  writeFileSync(join(vault, "Other.md"), "# Independent note\n");
  writeFileSync(
    join(vault, "pixel.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const foreignVault = join(root, "Separate vault");
  mkdirSync(foreignVault);
  copyFileSync(join(vault, "pixel.png"), join(foreignVault, "pixel.png"));
  const running = runPopoutProcess(root, "session");
  void running.catch(() => {});
  const deadline = Date.now() + 15000;
  while (existsSync(join(root, "picker.json")) && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(
    existsSync(join(root, "picker.json")),
    false,
    "The real launcher must consume its first selection",
  );
  writeFileSync(join(root, "picker.json"), JSON.stringify(foreignVault));
  const result = await running;
  assert.equal(result.mode, "session");
  assert.deepEqual(result.checks, [
    "ordinary-native-open",
    "retained-editor-draft",
    "popup-editor-history",
    "scoped-attachment",
    "no-popup-ipc-grant",
    "foreign-vault-resource-denied",
    "unbound-protocol-ipc-denied",
    "multiple-windows",
    "nested-window-denied",
    "native-header-controls",
    "failed-save-retains-window",
    "native-save-and-independent-close",
    "redock-main",
    "native-resource-cleanup",
  ]);
  assert.equal(
    readFileSync(join(vault, "Note.md"), "utf8"),
    original + "\nRetained native popup draft — café 笔记\n",
  );
  assert.equal(
    readFileSync(join(vault, "Other.md"), "utf8"),
    "# Independent note\n",
  );
});
