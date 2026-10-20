import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import {
  acceptConflictSide,
  nativeFailure,
  openConflictReview,
  reviewedText,
  saveConflictResult,
} from "./conflict-review.mjs";

const acceptance = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
const card = "[data-mira-link-preview-content]";
const editable = `${card} .cm-content[contenteditable="true"]`;

async function fixture(context, name) {
  const root = mkdtempSync(join(acceptance, `${name}-`));
  const vault = join(root, "预览 café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Home.md"), "# Home\n\n[[Target]]\n");
  const file = join(vault, "Target.md");
  writeFileSync(file, "# Target\n\nOriginal preview content.\n");
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
  const { browser } = session;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Home.md"]').click();
  await browser.$('button[aria-label="Open Home.md tab menu"]').click();
  await browser.$("span=Reading view").click();
  const trigger = browser.$(
    '[data-link-preview-trigger][data-link-preview-path="Target"][data-link-preview-state="resolved"]',
  );
  await trigger.waitForDisplayed({ timeout: 15000 });
  await browser.keys(Key.Tab);
  await browser.execute(
    (element) => {
      element.blur();
      element.focus();
    },
    await trigger,
  );
  await browser.waitUntil(async () =>
    browser.execute(
      (element) =>
        document.activeElement === element && element.matches(":focus-visible"),
      await trigger,
    ),
  );
  try {
    await browser
      .$(`${card} [data-editable-markdown-preview] [role="button"]`)
      .waitForDisplayed({ timeout: 15000 });
  } catch (error) {
    console.error(
      "Preview fixture state:",
      await browser.execute(() => ({
        text: document.body.innerText.slice(0, 3000),
        links: [
          ...document.querySelectorAll("[data-link-preview-trigger]"),
        ].map((element) => element.outerHTML),
        cards: [
          ...document.querySelectorAll("[data-mira-link-preview-content]"),
        ].map((element) => element.outerHTML),
      })),
    );
    throw error;
  }
  await browser
    .$(`${card} [data-editable-markdown-preview] [role="button"]`)
    .click();
  await browser.$(editable).waitForDisplayed();
  return { root, file, session, browser };
}

async function edit(browser, contents) {
  const editor = browser.$(editable);
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(contents);
}
async function diskVersion(browser, contents) {
  await reviewedText(browser, "Target.md", "Disk version", contents);
}
async function recover(browser, name) {
  await acceptConflictSide(
    browser,
    "Target.md",
    name === "Use disk version" ? "Right" : "Left",
  );
  await saveConflictResult(browser, "Target.md");
}

test("external changes in a Markdown preview block Close and require a fresh recovery decision", async (context) => {
  const { browser, session, root, file } = await fixture(
    context,
    "preview-keep",
  );
  const local = "Preview draft retained — 笔记\n";
  await edit(browser, local);
  writeFileSync(file, "External preview one\n");
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  await openConflictReview(browser, "Target.md");
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(file, "utf8"), "External preview one\n");
  await reviewedText(browser, "Target.md", "Your version", local);
  await diskVersion(browser, "External preview one\n");
  writeFileSync(file, "External preview two\n");
  await recover(browser, "Keep my version");
  await diskVersion(browser, "External preview two\n");
  assert.equal(readFileSync(file, "utf8"), "External preview two\n");
  await recover(browser, "Keep my version");
  await browser.waitUntil(() => readFileSync(file, "utf8") === local);
  await session.close();
  const restored = await nativeSession("preview-keep-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$('[data-path="Target.md"]').click();
  await restored.browser.waitUntil(async () =>
    (
      await restored.browser.$('.cm-content[contenteditable="true"]').getText()
    ).includes("Preview draft retained"),
  );
  assert.equal(readFileSync(file, "utf8"), local);
  await restored.close();
});

test("accepting the disk version replaces a preview draft and permits later saves", async (context) => {
  const { browser, session, file } = await fixture(context, "preview-disk");
  await edit(browser, "Discard this preview draft\n");
  writeFileSync(file, "Reviewed preview disk content\n");
  await openConflictReview(browser, "Target.md");
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
  await recover(browser, "Use disk version");
  await browser.waitUntil(async () =>
    (await browser.$(editable).getText()).includes(
      "Reviewed preview disk content",
    ),
  );
  assert.equal(readFileSync(file, "utf8"), "Reviewed preview disk content\n");
  await edit(browser, "Saved after preview recovery\n");
  await session.close();
  assert.equal(readFileSync(file, "utf8"), "Saved after preview recovery\n");
});

test("closing a preview's owning tab retains its failed draft and App shutdown barrier", async (context) => {
  const { browser, session, file } = await fixture(context, "preview-retired");
  const local = "Retained draft from a closed preview\n";
  await edit(browser, local);
  writeFileSync(file, "External retired-preview content\n");
  await openConflictReview(browser, "Target.md");
  await browser.$('button[aria-label="Close Home.md"]').click();
  await browser.$('button[aria-label="Close Home.md"]').waitForExist();
  await reviewedText(browser, "Target.md", "Your version", local);
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(
    await browser.$('button[aria-label="Close Home.md"]').isExisting(),
    true,
  );
  await reviewedText(browser, "Target.md", "Your version", local);
  assert.equal(
    readFileSync(file, "utf8"),
    "External retired-preview content\n",
  );
  await recover(browser, "Keep my version");
  await browser.waitUntil(() => readFileSync(file, "utf8") === local);
  await browser.$('button[aria-label="Close Home.md"]').click();
  await browser.waitUntil(async () => !(await browser.$(card).isExisting()));
  await session.close();
});

test(
  "deleted preview recovery resets a retired writer and permits native shutdown",
  { timeout: 60000 },
  async (context) => {
    const { browser, session, file } = await fixture(
      context,
      "preview-deleted-retired",
    );
    const draft = "Retained draft before native deletion\n";
    const merged =
      "# Recovered retired preview\n\nNative reviewed result — café\n";
    await edit(browser, draft);
    unlinkSync(file);
    await browser.$(editable).waitForExist({ reverse: true, timeout: 15000 });
    const review = await openConflictReview(browser, "Target.md");
    await reviewedText(browser, "Target.md", "Your version", draft);
    assert.ok(
      (await review.getText()).includes("The file was deleted from disk."),
    );
    assert.equal(existsSync(file), false);
    await session.requestClose();
    await browser.$(nativeFailure).waitForDisplayed();
    assert.equal(
      session.isRunning(),
      true,
      "Retiring an editor cannot waive its failed write",
    );
    assert.equal(existsSync(file), false);
    await review
      .$('textarea[aria-label="Edit Merged version"]')
      .setValue(merged);
    await saveConflictResult(browser, "Target.md");
    await browser.waitUntil(
      () => existsSync(file) && readFileSync(file, "utf8") === merged,
      { timeout: 15000 },
    );
    await session.close();
    assert.equal(readFileSync(file, "utf8"), merged);
  },
);
