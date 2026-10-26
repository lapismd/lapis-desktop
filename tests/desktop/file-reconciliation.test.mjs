import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
  readFileSync,
  existsSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import {
  conflictReview,
  nativeFailure,
  openConflictReview,
  reviewedText,
} from "./conflict-review.mjs";

test("external file changes reconcile the real Explorer and clean editor through rename and deletion", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "app-reconcile-"),
  );
  const vault = join(root, "Reconciliation café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "# Before\n");
  const session = await nativeSession("app-reconcile", root);
  context.after(session.cleanup);
  const { browser } = session;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Note.md"]').click();
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  writeFileSync(join(vault, "Created.md"), "# External creation\n");
  await browser
    .$('[data-path="Created.md"]')
    .waitForDisplayed({ timeout: 5000 });
  writeFileSync(join(vault, "Note.md"), "# From disk\n");
  await browser.waitUntil(async () =>
    (await editor.getText()).includes("From disk"),
  );
  renameSync(join(vault, "Note.md"), join(vault, "Renamed.md"));
  await browser.$('[data-path="Renamed.md"]').waitForDisplayed();
  await browser.waitUntil(
    async () => !(await browser.$('[data-path="Note.md"]').isExisting()),
  );
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue("# Saved after external rename\n");
  await browser.waitUntil(() =>
    readFileSync(join(vault, "Renamed.md"), "utf8").includes(
      "Saved after external rename",
    ),
  );
  assert.equal(existsSync(join(vault, "Note.md")), false);
  rmSync(join(vault, "Renamed.md"));
  await browser.waitUntil(
    async () => !(await browser.$('[data-path="Renamed.md"]').isExisting()),
  );
  await browser.waitUntil(
    async () =>
      !(await browser.$('.cm-content[contenteditable="true"]').isExisting()),
  );
  assert.equal(
    readFileSync(join(vault, "Created.md"), "utf8"),
    "# External creation\n",
  );
  await session.close();
});

for (const operation of ["rename", "delete"]) {
  test(`external ${operation} retains a failed dirty editor until explicit missing-file recovery`, async (context) => {
    const root = mkdtempSync(
      join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `dirty-${operation}-`),
    );
    const vault = join(root, "Dirty external change");
    mkdirSync(vault);
    const original = join(vault, "Note.md"),
      moved = join(vault, "Moved.md");
    writeFileSync(original, "# Original disk version\n");
    const session = await nativeSession(`dirty-${operation}`, root);
    context.after(session.cleanup);
    context.after(() => chmodSync(vault, 0o755));
    const { browser } = session;
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await browser.$("button*=Open Vault").click();
    await browser.$('[data-notes-ready="true"]').waitForDisplayed();
    await browser.$('[data-path="Note.md"]').click();
    const editor = browser.$('.cm-content[contenteditable="true"]');
    await editor.waitForDisplayed();
    chmodSync(vault, 0o555);
    await editor.click();
    await browser.keys([Key.Command, "a"]);
    await browser.keys(Key.NULL);
    await editor.addValue("# Retained local draft\n");
    await session.requestClose();
    await browser.$(nativeFailure).waitForDisplayed();
    assert.equal(readFileSync(original, "utf8"), "# Original disk version\n");
    chmodSync(vault, 0o755);
    if (operation === "rename") {
      renameSync(original, moved);
      await browser.$('[data-path="Moved.md"]').waitForDisplayed();
    } else rmSync(original);
    await browser.waitUntil(
      async () => !(await browser.$('[data-path="Note.md"]').isExisting()),
    );
    await browser.waitUntil(() =>
      browser.execute(() =>
        [
          ...document.querySelectorAll(
            '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"]',
          ),
        ].some((toast) =>
          toast.textContent.includes(
            "Local edits remain in the original view for recovery",
          ),
        ),
      ),
    );
    assert.ok((await editor.getText()).includes("Retained local draft"));
    assert.equal(existsSync(original), false);
    await session.requestClose();
    const conflict = await openConflictReview(browser, "Note.md");
    await conflict.$("button=Check disk again").click();
    await browser.waitUntil(async () =>
      (await conflict.getText()).includes("The file was deleted from disk."),
    );
    await reviewedText(
      browser,
      "Note.md",
      "Your version",
      "# Retained local draft\n",
    );
    await conflict.$("button=Use disk version").click();
    await browser.waitUntil(
      async () => !(await browser.$(conflictReview("Note.md")).isExisting()),
    );
    await session.close();
    assert.equal(existsSync(original), false);
    if (operation === "rename")
      assert.equal(readFileSync(moved, "utf8"), "# Original disk version\n");
  });
}
