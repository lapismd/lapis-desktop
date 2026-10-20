import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const identifier = `${details} button[data-side="commit"]`;
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function checkpoint(browser, previous) {
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
  if (!(await browser.$(details).isDisplayed())) await browser.$(saved).click();
  await browser.$(identifier).waitForDisplayed();
  const read = async () =>
    (await browser.$(identifier).getAttribute("aria-label"))?.match(
      /Copy Git commit SHA ([0-9a-f]{40})$/u,
    )?.[1];
  await browser.waitUntil(
    async () => {
      const id = await read();
      return (await browser.$(saved).isExisting()) && id && id !== previous;
    },
    {
      timeout: 30000,
      timeoutMsg:
        "Saved changes must produce a retained checkpoint automatically",
    },
  );
  return read();
}
async function storagePath(browser) {
  if (await browser.$(details).isDisplayed()) {
    await browser.$(saved).click();
    await browser.$(details).waitForDisplayed({ reverse: true });
  }
  const buttons = await browser.$$('button[aria-label="Open settings"]');
  let opened = false;
  for (const button of buttons) {
    if (!(await button.isDisplayed())) continue;
    await button.click();
    opened = true;
    break;
  }
  assert.equal(
    opened,
    true,
    "The ordinary workspace Settings action is reachable",
  );
  await browser.$("button=Repository History").waitForDisplayed();
  await browser.$("button=Repository History").click();
  const path = browser.$('section[aria-label="History storage"] code');
  await path.waitForDisplayed({ timeout: 30000 });
  const result = await path.getText();
  const close = browser.$('button[aria-label="Close settings"]');
  await close.click();
  await close.waitForDisplayed({ reverse: true });
  return result;
}
async function inspectFile(browser, path, content) {
  await browser.$(details).$("button=Open in JJ Log").click();
  const panel = browser.$('[aria-label="Repository history"]');
  await panel.waitForDisplayed({ timeout: 30000 });
  const file = panel.$('[aria-label="Changed files"]').$(`button=${path}`);
  await file.waitForDisplayed({ timeout: 30000 });
  await file.click();
  const diff = panel.$(`[aria-label="Changes to ${path}"]`);
  await diff.waitForDisplayed({ timeout: 30000 });
  await browser.waitUntil(async () => (await diff.getText()).includes(content));
}

test(
  "cold ordinary backup captures external files and final editor saves in stable external history",
  { timeout: 120000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "automatic-backup-"));
    const vault = join(root, "Notes café 笔记");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    const file = join(vault, "Note.md");
    writeFileSync(file, "# Initial saved note\n");
    const first = await nativeSession("automatic-backup", root);
    context.after(first.cleanup);
    const browser = first.browser;
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await browser.$("button*=Open Vault").click();
    await ready(browser);
    const initial = await checkpoint(browser);
    const repository = await storagePath(browser);
    assert.ok(repository && existsSync(repository));
    assert.ok(
      relative(vault, repository).startsWith(".."),
      "Default history lives outside the vault",
    );
    for (const name of [".jj", ".git"])
      assert.equal(existsSync(join(vault, name)), false);

    writeFileSync(
      join(vault, "External.md"),
      "# Automatically retained external file\n",
    );
    const external = await checkpoint(browser, initial);
    await inspectFile(
      browser,
      "External.md",
      "Automatically retained external file",
    );
    await browser.$('[data-path="Note.md"]').click();
    const editor = browser.$('.cm-content[contenteditable="true"]');
    await editor.waitForDisplayed().catch(async (error) => {
      console.error(
        "Editor navigation diagnostic:",
        await browser.execute(() => document.body.innerText),
      );
      await browser.saveScreenshot(join(root, "editor-navigation.png"));
      throw error;
    });
    await editor.click();
    await browser.keys([Key.Command, "a"]);
    await browser.keys(Key.NULL);
    const draft = "# Retained by guarded Quit — café 笔记\n";
    await editor.addValue(draft);
    await first.close(true);
    assert.equal(readFileSync(file, "utf8"), draft);

    const cold = await nativeSession("automatic-backup-reopen", root);
    context.after(cold.cleanup);
    await ready(cold.browser);
    const afterSave = await checkpoint(cold.browser, external);
    await inspectFile(cold.browser, "Note.md", "Retained by guarded Quit");
    assert.equal(
      await storagePath(cold.browser),
      repository,
      "Cold startup retains the vault-owned history location",
    );
    for (const name of [".jj", ".git"])
      assert.equal(existsSync(join(vault, name)), false);
    writeFileSync(
      join(root, "backup-receipt.json"),
      JSON.stringify({ initial, external, afterSave, repository }, null, 2) +
        "\n",
    );
    await cold.close();
  },
);
