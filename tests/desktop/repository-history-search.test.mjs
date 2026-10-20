import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const search = '[data-ui-component="search-panel"]';
const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const blame = 'section[aria-label="File blame"]';
const panel = '[aria-label="Repository history"]';
const text = 'content:violetledgerhistory author:"Lapis Notes"';
const original =
  "# Retained archive\n\nvioletledgerhistory was in the original decision.\n";
async function session(context, name, root) {
  const active = await nativeSession(name, root);
  context.after(async () => {
    if (active.isRunning()) {
      writeFileSync(
        join(root, `${name}-body.txt`),
        await active.browser.execute(() => document.body.innerText),
      );
      await active.browser.saveScreenshot(join(root, `${name}-screen.png`));
    }
    await active.cleanup();
  });
  return active;
}
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function checkpoint(browser, previous) {
  await browser.$(saved).click();
  let commit;
  await browser.waitUntil(
    async () => {
      commit = (
        await browser
          .$(details)
          .$('button[data-side="commit"]')
          .getAttribute("aria-label")
      )?.match(/Copy Git commit SHA ([0-9a-f]{40})$/u)?.[1];
      return commit && commit !== previous;
    },
    { timeout: 30000 },
  );
  await browser.$(saved).click();
  await browser.$(details).waitForDisplayed({ reverse: true });
  return commit;
}
async function query(browser, value) {
  const input = browser.$(`${search} .cm-content[contenteditable="true"]`);
  await input.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await input.addValue(value);
}
async function openVersion(browser, commit) {
  const row = browser.$(
    `${search} [role="treeitem"][aria-level="1"][aria-label*="Note.md"]`,
  );
  await row.waitForDisplayed({ timeout: 30000 });
  if ((await row.getAttribute("aria-expanded")) === "false") await row.click();
  const version = browser.$(`${search} [role="treeitem"][aria-level="2"]`);
  await version.waitForDisplayed({ timeout: 30000 });
  if ((await version.getAttribute("aria-expanded")) === "false")
    await version.$("button").click();
  const open = browser.$(search).$('button[aria-label^="Open saved version "]');
  await open.waitForDisplayed({ timeout: 30000 });
  await open.click();
  await browser.$(blame).waitForDisplayed({ timeout: 30000 });
  await browser.waitUntil(
    async () =>
      (await browser.$(blame).getText()).includes("violetledgerhistory"),
    { timeout: 30000 },
  );
  assert.ok(
    (
      await browser
        .$(`${blame} > header button[data-side="commit"]`)
        .getAttribute("aria-label")
    ).endsWith(commit),
    "Search opens the exact saved commit, not the current working copy",
  );
}

test(
  "cold native Search filters saved text/author and restores its exact pinned version through the UI",
  { timeout: 180000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "history-search-ui-"));
    const vault = join(root, "Historical search notes");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    writeFileSync(
      join(vault, ".lapis/hotkeys.json"),
      JSON.stringify({
        "repository-history:open-history-search": [
          { key: "F6", modifiers: [] },
        ],
      }),
    );
    const file = join(vault, "Note.md");
    writeFileSync(file, original);
    const first = await session(context, "history-search-ui", root);
    const browser = first.browser;
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await browser.$("button*=Open Vault").click();
    await ready(browser);
    const initial = await checkpoint(browser);
    const later = "# Current note no longer contains the archived decision\n";
    writeFileSync(file, later);
    const changed = await checkpoint(browser, initial);
    await browser.keys(Key.F6);
    await browser.$(search).waitForDisplayed({ timeout: 30000 });
    await query(browser, text);
    const result = browser.$(
      `${search} [role="treeitem"][aria-level="1"][aria-label*="Note.md"]`,
    );
    await result.waitForDisplayed({ timeout: 30000 });
    await query(browser, 'content:violetledgerhistory author:"Nobody"');
    await browser.waitUntil(
      async () =>
        (await browser.$(search).getText()).includes("No matches found."),
      { timeout: 30000 },
    );
    assert.equal(
      await result.isExisting(),
      false,
      "A nonmatching author excludes the previously visible saved version",
    );
    await query(browser, text);
    await openVersion(browser, initial);
    assert.equal(
      readFileSync(file, "utf8"),
      later,
      "Historical search and blame remain immutable reads",
    );
    await first.close(true);
    const persisted = readFileSync(
      join(vault, ".lapis/workspace.json"),
      "utf8",
    );
    assert.ok(
      persisted.includes(JSON.stringify(text)),
      "The live authored query is persisted before cold reopening",
    );
    const current = "# Newer external save before cold reopening\n";
    writeFileSync(file, current);
    const cold = await session(context, "history-search-ui-reopen", root);
    await ready(cold.browser);
    await cold.browser.$(search).waitForDisplayed({ timeout: 30000 });
    await cold.browser.waitUntil(
      async () =>
        (await cold.browser.$(`${search} .cm-content`).getText())
          .replace(/\s+/gu, " ")
          .trim() === text,
      { timeout: 5000 },
    );
    await openVersion(cold.browser, initial);
    assert.equal(readFileSync(file, "utf8"), current);
    await cold.browser
      .$(blame)
      .$('button[aria-label$=" — Lapis Notes"]')
      .click();
    await cold.browser.$(panel).waitForDisplayed({ timeout: 30000 });
    const fileButton = cold.browser
      .$(panel)
      .$('[aria-label="Changed files"]')
      .$("button*=Note.md");
    await fileButton.waitForDisplayed({ timeout: 30000 });
    await fileButton.click();
    const restore = cold.browser
      .$(panel)
      .$('button[aria-label="Restore this file version"]');
    await restore.waitForDisplayed();
    let position,
      stable = 0;
    await cold.browser.waitUntil(
      async () => {
        const next = JSON.stringify(await restore.getLocation());
        stable = next === position ? stable + 1 : 0;
        position = next;
        return stable >= 2;
      },
      { timeout: 5000, interval: 100 },
    );
    await restore.click();
    const dialog = cold.browser.$('[role="alertdialog"]');
    await dialog.$("button=Restore file").waitForEnabled({ timeout: 30000 });
    await dialog.$("button=Restore file").click();
    await dialog.waitForDisplayed({ reverse: true, timeout: 30000 });
    assert.equal(
      readFileSync(file, "utf8"),
      original,
      "Restore applies the immutable search hit through native preview and guarded IO",
    );
    writeFileSync(
      join(root, "history-search-ui-receipt.json"),
      JSON.stringify(
        { initial, changed, query: text, restored: original },
        null,
        2,
      ) + "\n",
    );
    await cold.close();
  },
);
