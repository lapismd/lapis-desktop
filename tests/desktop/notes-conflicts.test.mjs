import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import {
  acceptConflictSide,
  conflictReview,
  nativeFailure,
  openConflictReview,
  reviewedText,
  saveConflictResult,
} from "./conflict-review.mjs";

const acceptance = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
async function fixture(context, name) {
  const root = mkdtempSync(join(acceptance, `${name}-`));
  const vault = join(root, "笔记 café");
  mkdirSync(vault);
  const file = join(vault, "Note.md");
  writeFileSync(file, "# Original note\n");
  const session = await nativeSession(name, root);
  context.after(async () => {
    try {
      if (session.isRunning())
        writeFileSync(
          join(root, "conflict-body.txt"),
          await session.browser.execute(() => document.body.innerText),
        );
    } finally {
      await session.cleanup();
    }
  });
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
  await reviewedText(browser, "Note.md", "Disk version", content);
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
  await browser.$(nativeFailure).waitForDisplayed();
  await openConflictReview(browser, "Note.md");
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(file, "utf8"), "# External one\n");
  await reviewedText(browser, "Note.md", "Your version", local);
  await diskVersion(browser, "# External one\n");
  writeFileSync(file, "# External two\n");
  await acceptConflictSide(browser, "Note.md", "Left");
  await saveConflictResult(browser, "Note.md");
  await diskVersion(browser, "# External two\n");
  assert.equal(readFileSync(file, "utf8"), "# External two\n");
  await acceptConflictSide(browser, "Note.md", "Left");
  await saveConflictResult(browser, "Note.md");
  await browser.waitUntil(() => readFileSync(file, "utf8") === local);
  await browser.waitUntil(
    async () => !(await browser.$(conflictReview("Note.md")).isExisting()),
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
  await openConflictReview(browser, "Note.md");
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
  await acceptConflictSide(browser, "Note.md", "Right");
  await saveConflictResult(browser, "Note.md");
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
  await openConflictReview(browser, "Note.md");
  await browser.$('button[aria-label="Close Note.md"]').click();
  await browser.$('button[aria-label="Close Note.md"]').waitForExist();
  await reviewedText(browser, "Note.md", "Your version", draft);
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(
    await browser.$('button[aria-label="Close Note.md"]').isExisting(),
    true,
  );
  assert.equal(readFileSync(file, "utf8"), "# External closed-tab version\n");
  await acceptConflictSide(browser, "Note.md", "Left");
  await saveConflictResult(browser, "Note.md");
  await browser.waitUntil(() => readFileSync(file, "utf8") === draft);
  await browser.$('button[aria-label="Close Note.md"]').click();
  await browser.waitUntil(
    async () =>
      !(await browser.$('button[aria-label="Close Note.md"]').isExisting()),
  );
  await session.close();
});

test("an edited merge survives review closure and resets its writer for later saving", async (context) => {
  const { session, browser, file } = await fixture(context, "conflict-edited");
  const draft = "# Retained local result — 笔记\n";
  const external = "# Reviewed external result\n";
  const merged = "# Merged result — café\n\nBoth decisions are retained.\n";
  await edit(browser, draft);
  writeFileSync(file, external);
  const review = await openConflictReview(browser, "Note.md");
  await reviewedText(browser, "Note.md", "Your version", draft);
  const result = review.$('textarea[aria-label="Edit Merged version"]');
  await result.setValue(merged);
  assert.equal(await result.getValue(), merged);
  const wrap = review.$('button[aria-label="Wrap text"]');
  await wrap.click();
  assert.equal(await wrap.getAttribute("aria-pressed"), "true");
  await browser.$('button[aria-label="Close Resolve Note.md"]').click();
  await browser
    .$(conflictReview("Note.md"))
    .waitForDisplayed({ reverse: true });
  assert.equal(readFileSync(file, "utf8"), external);
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(
    session.isRunning(),
    true,
    "Closing the review cannot waive the application save barrier",
  );
  assert.equal(readFileSync(file, "utf8"), external);
  await openConflictReview(browser, "Note.md");
  assert.equal(
    await browser
      .$(conflictReview("Note.md"))
      .$('textarea[aria-label="Edit Merged version"]')
      .getValue(),
    merged,
  );
  await saveConflictResult(browser, "Note.md");
  await browser
    .$(conflictReview("Note.md"))
    .waitForDisplayed({ reverse: true });
  assert.equal(readFileSync(file, "utf8"), merged);
  await browser.waitUntil(
    async () =>
      !(await browser
        .$("button*=Review your draft before saving")
        .isExisting()),
  );
  await edit(browser, "# Saved after edited merge\n");
  await session.close();
  assert.equal(readFileSync(file, "utf8"), "# Saved after edited merge\n");
});
