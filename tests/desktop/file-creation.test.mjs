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

test("native exclusive creation preserves collisions and bytes while Explorer uses new-file intent", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "exclusive-create-"),
  );
  const vault = join(root, "Creation café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# Welcome\n");
  const session = await nativeSession("exclusive-create", root);
  context.after(session.cleanup);
  const { browser } = session;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  assert.equal(
    await browser.execute(
      (vault) =>
        globalThis.__lapisConditionalWriteAcceptance.availableCreate(vault),
      vault,
    ),
    true,
  );
  writeFileSync(join(vault, "collision.md"), "external destination");
  const collision = await browser.execute(
    (vault) =>
      globalThis.__lapisConditionalWriteAcceptance.create(
        vault,
        "collision.md",
        "overwritten",
      ),
    vault,
  );
  assert.equal(collision.ok, false);
  assert.equal(collision.code, "EEXIST");
  assert.equal(
    readFileSync(join(vault, "collision.md"), "utf8"),
    "external destination",
  );
  const binary = await browser.execute(
    (vault) =>
      globalThis.__lapisConditionalWriteAcceptance.create(
        vault,
        "附件.bin",
        [0, 255, 128, 1],
      ),
    vault,
  );
  assert.deepEqual(binary, { ok: true });
  assert.deepEqual(
    [...readFileSync(join(vault, "附件.bin"))],
    [0, 255, 128, 1],
  );
  const text = await browser.execute(
    (vault) =>
      globalThis.__lapisConditionalWriteAcceptance.create(
        vault,
        "café.md",
        "# 笔记\n",
      ),
    vault,
  );
  assert.deepEqual(text, { ok: true });
  assert.equal(readFileSync(join(vault, "café.md"), "utf8"), "# 笔记\n");
  await browser.$('button[aria-label="Create File"]').click();
  await browser.waitUntil(() => existsSync(join(vault, "Untitled.md")));
  await browser.$('[data-path="Untitled.md"]').waitForDisplayed();
  await browser.$('button[aria-label="Create File"]').click();
  await browser.waitUntil(() => existsSync(join(vault, "Untitled 2.md")));
  await browser.$('[data-path="Untitled 2.md"]').waitForDisplayed();
  assert.equal(
    readFileSync(join(vault, "collision.md"), "utf8"),
    "external destination",
  );
  await session.close();
});
