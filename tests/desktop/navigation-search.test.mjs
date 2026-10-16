import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const panel = '[data-ui-component="search-panel"]';
const result = (browser, path) =>
  browser.$(
    `${panel} [role="treeitem"][aria-level="1"][aria-label^="${path},"]`,
  );
async function query(browser, value) {
  const input = browser.$(`${panel} .cm-content[contenteditable="true"]`);
  await input.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await input.addValue(value);
}

test("native Search indexes edits and external changes, navigates to notes and restores its saved query after restart", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "search-"),
  );
  const vault = join(root, "Native Search vault");
  mkdirSync(vault);
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(
    join(vault, ".lapis", "hotkeys.json"),
    JSON.stringify({ "search:open-search": [{ key: "F6", modifiers: [] }] }),
  );
  writeFileSync(join(vault, "Alfa.md"), "# Alfa\n\ntangerine lexical text\n");
  writeFileSync(join(vault, "Beta.md"), "# Beta\n\nUnrelated note\n");
  const session = await nativeSession("search", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.keys(Key.F6);
  await browser.$(panel).waitForDisplayed({ timeout: 5000 });
  await query(browser, "tangerine");
  await result(browser, "Alfa.md").waitForDisplayed({ timeout: 15000 });
  assert.equal(await result(browser, "Beta.md").isExisting(), false);
  if (
    (await result(browser, "Alfa.md").getAttribute("aria-expanded")) === "false"
  )
    await result(browser, "Alfa.md").click();
  await browser.$(`${panel} [role="treeitem"][aria-level="2"]`).click();
  const editor = browser.$(
    '[data-ui-component="editor"] .cm-content[contenteditable="true"]',
  );
  await editor.waitForDisplayed();
  assert.match(await editor.getText(), /tangerine lexical text/);
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue("# Alfa\n\nmarmalade edited text\n");
  await browser.waitUntil(() =>
    readFileSync(join(vault, "Alfa.md"), "utf8").includes(
      "marmalade edited text",
    ),
  );
  await query(browser, "marmalade");
  await result(browser, "Alfa.md").waitForDisplayed();
  renameSync(join(vault, "Alfa.md"), join(vault, "Moved.md"));
  await result(browser, "Moved.md").waitForDisplayed();
  await result(browser, "Alfa.md").waitForExist({ reverse: true });
  writeFileSync(
    join(vault, "Created.md"),
    "# Created\n\nmarmalade created text\n",
  );
  await result(browser, "Created.md").waitForDisplayed();
  rmSync(join(vault, "Moved.md"));
  await result(browser, "Moved.md").waitForExist({ reverse: true });
  await result(browser, "Created.md").waitForDisplayed();
  await session.close();
  const restored = await nativeSession("search-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$(panel).waitForDisplayed();
  assert.equal(
    await restored.browser.$(`${panel} .cm-content`).getText(),
    "marmalade",
  );
  await result(restored.browser, "Created.md").waitForDisplayed();
  assert.equal(await result(restored.browser, "Alfa.md").isExisting(), false);
  assert.equal(await result(restored.browser, "Moved.md").isExisting(), false);
  await restored.close();
});
