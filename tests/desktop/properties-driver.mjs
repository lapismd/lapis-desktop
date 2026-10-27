import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

export const originalPropertyText =
  "---\nstatus: ready\n---\n# Properties note\n";
export async function propertiesFixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Properties café");
  mkdirSync(vault);
  const file = join(vault, "Note.md");
  writeFileSync(file, originalPropertyText);
  const session = await nativeSession(name, root);
  context.after(async () => {
    try {
      if (session.isRunning())
        await session.browser.execute(() =>
          globalThis.__lapisTasksAcceptance?.release(),
        );
      if (session.isRunning())
        writeFileSync(
          join(root, "properties-body.txt"),
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
  await browser.$('button[aria-label="Open command palette"]').click();
  const input = browser.$('[role="dialog"] input');
  await input.waitForDisplayed();
  await input.setValue("Open File Properties");
  await browser.$('[role="option"]*=Open File Properties').click();
  const status = () =>
    browser.$(
      '[data-testid="file-properties-panel"] [aria-label="status value"]',
    );
  await status().waitForDisplayed();
  return { root, vault, file, session, browser, status };
}
export async function setPropertyStatus(browser, status, value, commit = true) {
  await status().click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await status().addValue(value);
  assert.equal(
    await status().getText(),
    value,
    "The native value editor must receive the full input",
  );
  if (commit) await browser.keys(Key.Enter);
}
