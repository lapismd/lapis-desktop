import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function checkpoint(browser, previous) {
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
  if (!(await browser.$(details).isDisplayed())) await browser.$(saved).click();
  let current;
  await browser.waitUntil(
    async () => {
      current = (
        await browser
          .$(details)
          .$('button[data-side="commit"]')
          .getAttribute("aria-label")
      )?.match(/Copy Git commit SHA ([0-9a-f]{40})$/u)?.[1];
      return current && current !== previous;
    },
    {
      timeout: 30000,
      timeoutMsg:
        "Saved changes after cancelled Quit must create a checkpoint automatically",
    },
  );
  return current;
}
async function replace(browser, text) {
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(text);
}

test(
  "failed final backup keeps the actual editor usable, resumes automatic watching and retries guarded Quit",
  { timeout: 180000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "backup-guarded-leave-"));
    const vault = join(root, "Guarded notes");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    const file = join(vault, "Note.md");
    const protectedFile = join(vault, "Protected.md");
    writeFileSync(file, "# Original note\n");
    writeFileSync(protectedFile, "Original external file\n");
    const first = await nativeSession("guarded-backup-leave", root);
    context.after(first.cleanup);
    context.after(() => chmodSync(protectedFile, 0o644));
    const browser = first.browser;
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await browser.$("button*=Open Vault").click();
    await ready(browser);
    await browser.$('[data-path="Note.md"]').click();
    await browser
      .$('.cm-content[contenteditable="true"]')
      .waitForDisplayed({ timeout: 30000 });
    await browser.execute(() => {
      globalThis.__retainedLeaveEditor = document.querySelector(
        '.cm-content[contenteditable="true"]',
      );
    });
    const draft = "# Draft retained after failed Quit\n";
    await replace(browser, draft);
    writeFileSync(
      protectedFile,
      "Changed external file blocks final capture\n",
    );
    chmodSync(protectedFile, 0o000);
    await first.requestClose(true);
    const failure = browser.$(
      'section[aria-label="Notes workspace"] [data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"][role="alert"]',
    );
    await failure.waitForDisplayed({ timeout: 30000 });
    assert.equal(first.isRunning(), true);
    await browser.$('[data-notes-ready="true"]').waitForDisplayed();
    assert.equal(
      await browser.execute(
        () =>
          document.contains(globalThis.__retainedLeaveEditor) &&
          globalThis.__retainedLeaveEditor ===
            document.querySelector('.cm-content[contenteditable="true"]'),
      ),
      true,
      "Failed final persistence must retain the same live editor DOM and its owned session",
    );
    assert.equal(readFileSync(file, "utf8"), draft);
    assert.match(
      await browser.$('.cm-content[contenteditable="true"]').getText(),
      /Draft retained after failed Quit/,
    );

    chmodSync(protectedFile, 0o644);
    await ready(browser);
    const repaired = await checkpoint(browser);
    await browser.$(saved).click();
    await browser.$(details).waitForDisplayed({ reverse: true });
    writeFileSync(
      join(vault, "Later.md"),
      "Automatically retained after cancelled Quit\n",
    );
    await browser
      .$('[data-path="Later.md"]')
      .waitForDisplayed({ timeout: 30000 });
    const later = await checkpoint(browser, repaired);
    await browser.$(saved).click();
    await browser.$(details).waitForDisplayed({ reverse: true });
    const finalDraft = "# Saved by successful Quit retry\n";
    await replace(browser, finalDraft);
    await first.close(true);
    assert.equal(readFileSync(file, "utf8"), finalDraft);

    const cold = await nativeSession("guarded-backup-reopen", root);
    context.after(cold.cleanup);
    await ready(cold.browser);
    const retained = await checkpoint(cold.browser, later);
    await cold.browser.$(details).$("button=Open in JJ Log").click();
    const panel = cold.browser.$('[aria-label="Repository history"]');
    await panel.waitForDisplayed({ timeout: 30000 });
    const note = panel.$('[aria-label="Changed files"]').$("button=Note.md");
    await note.waitForDisplayed({ timeout: 30000 });
    await note.click();
    const diff = panel.$('[aria-label="Changes to Note.md"]');
    await diff.waitForDisplayed({ timeout: 30000 });
    await cold.browser.waitUntil(async () =>
      (await diff.getText()).includes("Saved by successful Quit retry"),
    );
    writeFileSync(
      join(root, "guarded-leave-receipt.json"),
      JSON.stringify({ repaired, later, retained }, null, 2) + "\n",
    );
    await cold.close();
  },
);
