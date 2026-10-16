import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const acceptance = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
async function fixture(context, name) {
  const root = mkdtempSync(join(acceptance, `${name}-`));
  const vault = join(root, "笔记 café");
  mkdirSync(vault);
  const file = join(vault, "Note.md");
  writeFileSync(file, "# Original note\n");
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Note.md"]').click();
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
  return { session, browser, file, root };
}
async function edit(browser, content) {
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(content);
}
async function diskVersion(browser, content) {
  await browser.waitUntil(
    async () =>
      (await browser
        .$('textarea[aria-label="Disk version of Note.md"]')
        .getValue()) === content,
  );
}

test("external changes block Close and require a fresh decision before keeping local text", async (context) => {
  const { session, browser, file, root } = await fixture(
    context,
    "conflict-keep",
  );
  const local = "# My retained draft — 笔记\n";
  await edit(browser, local);
  writeFileSync(file, "# External one\n");
  await session.requestClose();
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  await browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(file, "utf8"), "# External one\n");
  assert.equal(
    await browser
      .$('textarea[aria-label="Your version of Note.md"]')
      .getValue(),
    local,
  );
  await diskVersion(browser, "# External one\n");
  writeFileSync(file, "# External two\n");
  await browser.$("button=Keep my version").click();
  await diskVersion(browser, "# External two\n");
  assert.equal(readFileSync(file, "utf8"), "# External two\n");
  await browser.$("button=Keep my version").waitForEnabled();
  await browser.$("button=Keep my version").click();
  await browser.waitUntil(() => readFileSync(file, "utf8") === local);
  await browser.waitUntil(
    async () =>
      !(await browser.$('[aria-label="File conflicts"]').isExisting()),
  );
  await session.close();
  const restored = await nativeSession("conflict-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.waitUntil(async () =>
    (
      await restored.browser.$('.cm-content[contenteditable="true"]').getText()
    ).includes("My retained draft"),
  );
  await restored.close();
});

test("accessible recovery accepts disk text without saving the discarded draft", async (context) => {
  const { session, browser, file } = await fixture(context, "conflict-disk");
  await edit(browser, "# Discard this draft\n");
  writeFileSync(file, "# Use the disk version\n");
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  assert.equal(readFileSync(file, "utf8"), "# Use the disk version\n");
  await browser.execute(
    readFileSync(
      new URL("../../node_modules/axe-core/axe.min.js", import.meta.url),
      "utf8",
    ),
  );
  const violations = await browser.executeAsync((done) =>
    window.axe
      .run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      })
      .then((result) =>
        done(
          result.violations.map(({ id, nodes }) => ({
            id,
            targets: nodes.map(({ target }) => target),
          })),
        ),
      ),
  );
  assert.deepEqual(violations, []);
  await browser.$("button=Use disk version").waitForEnabled();
  await browser.$("button=Use disk version").click();
  await browser.waitUntil(async () =>
    (await browser.$('.cm-content[contenteditable="true"]').getText()).includes(
      "Use the disk version",
    ),
  );
  assert.equal(readFileSync(file, "utf8"), "# Use the disk version\n");
  await edit(browser, "# Saved after accepting disk text\n");
  await session.close();
  assert.equal(
    readFileSync(file, "utf8"),
    "# Saved after accepting disk text\n",
  );
});

test("closing a conflicted tab retains its draft and shutdown barrier until recovery", async (context) => {
  const { session, browser, file } = await fixture(context, "conflict-retired");
  const draft = "# Draft from a closed tab\n";
  await edit(browser, draft);
  writeFileSync(file, "# External closed-tab version\n");
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  await browser.$('button[aria-label="Close Note.md"]').click();
  await browser.$('button[aria-label="Close Note.md"]').waitForDisplayed();
  assert.equal(
    await browser
      .$('textarea[aria-label="Your version of Note.md"]')
      .getValue(),
    draft,
  );
  await session.requestClose();
  await browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(
    await browser.$('button[aria-label="Close Note.md"]').isExisting(),
    true,
  );
  assert.equal(readFileSync(file, "utf8"), "# External closed-tab version\n");
  await browser.$("button=Keep my version").waitForEnabled();
  await browser.$("button=Keep my version").click();
  await browser.waitUntil(() => readFileSync(file, "utf8") === draft);
  await browser.$('button[aria-label="Close Note.md"]').click();
  await browser.waitUntil(
    async () =>
      !(await browser.$('button[aria-label="Close Note.md"]').isExisting()),
  );
  await session.close();
});
