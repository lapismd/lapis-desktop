import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

test("Explorer local-trash fallback preserves failed note writers and succeeds after explicit recovery", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "delete-writer-"),
  );
  const vault = join(root, "Delete writer vault");
  mkdirSync(vault);
  const file = join(vault, "Note.md");
  writeFileSync(file, "# Original note\n");
  const session = await nativeSession("delete-writer", root);
  context.after(session.cleanup);
  const { browser } = session;
  await browser.execute(() =>
    globalThis.__lapisConditionalWriteAcceptance.useLocalTrash(),
  );
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Note.md"]').click();
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  const external = "# External retained file\n",
    draft = "# My deletion-blocking draft\n";
  writeFileSync(file, external);
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(draft);
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  await browser.execute(() => {
    const row = document.querySelector('[data-path="Note.md"]');
    const rect = row.getBoundingClientRect();
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 20,
        clientY: rect.top + 10,
      }),
    );
  });
  const deletion = browser.$('[role="menuitem"]=Delete');
  await deletion.waitForDisplayed();
  await deletion.click();
  await browser.waitUntil(async () => !(await deletion.isExisting()));
  await browser.waitUntil(
    async () =>
      !existsSync(file) ||
      browser.execute(() =>
        [
          ...document.querySelectorAll(
            '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"]',
          ),
        ].some((toast) =>
          toast.textContent.includes("File changed on disk: Note.md"),
        ),
      ),
  );
  assert.equal(
    existsSync(file),
    true,
    "failed writer must prevent physical removal",
  );
  assert.equal(readFileSync(file, "utf8"), external);
  assert.equal(
    await browser
      .$('textarea[aria-label="Your version of Note.md"]')
      .getValue(),
    draft,
  );
  await browser.$("button=Use disk version").waitForEnabled();
  await browser.$("button=Use disk version").click();
  await browser.waitUntil(
    async () =>
      !(await browser.$('[aria-label="File conflicts"]').isExisting()),
  );
  await browser.execute(() => {
    const row = document.querySelector('[data-path="Note.md"]');
    const rect = row.getBoundingClientRect();
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 20,
        clientY: rect.top + 10,
      }),
    );
  });
  await browser.$('[role="menuitem"]=Delete').click();
  await browser.waitUntil(() => !existsSync(file));
  assert.equal(readFileSync(join(vault, ".trash/Note.md"), "utf8"), external);
  await session.close();
});
