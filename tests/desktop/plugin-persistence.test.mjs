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
import {
  conflictReview,
  nativeFailure,
  openConflictReview,
} from "./conflict-review.mjs";

async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Plugins café");
  mkdirSync(vault);
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(join(vault, "Note.md"), "# Plugin state\n");
  writeFileSync(join(vault, ".lapis/core-plugins.json"), "[]");
  writeFileSync(
    join(vault, ".lapis/app-shell-plugins.json"),
    '{"fmode":false}',
  );
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  return { root, vault, session, browser: session.browser };
}

async function pluginSwitch(browser, id) {
  await browser.$('button[aria-label="Open settings"]').click();
  await browser.$("button=Core plugins").waitForDisplayed();
  await browser.$("button=Core plugins").click();
  const control = browser.$(
    `[data-settings-plugin-id="${id}"] [role="switch"]`,
  );
  await control.waitForDisplayed();
  return control;
}

test("core plugin choices survive immediate native close and cold restoration", async (context) => {
  const { root, vault, session, browser } = await fixture(
    context,
    "core-close",
  );
  const control = await pluginSwitch(browser, "lapis-file-explorer");
  assert.equal(await control.getAttribute("aria-checked"), "true");
  await control.click();
  await session.close();
  assert.deepEqual(
    JSON.parse(readFileSync(join(vault, ".lapis/core-plugins.json"), "utf8")),
    ["lapis-file-explorer"],
  );
  const restored = await nativeSession("core-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const persisted = await pluginSwitch(restored.browser, "lapis-file-explorer");
  assert.equal(await persisted.getAttribute("aria-checked"), "false");
  await restored.close();
});

test("App Shell plugin conflicts preserve external bytes and recover through the existing control", async (context) => {
  const { vault, session, browser } = await fixture(context, "shell-conflict");
  const control = await pluginSwitch(browser, "fmode");
  assert.equal(await control.getAttribute("aria-checked"), "false");
  const path = join(vault, ".lapis/app-shell-plugins.json");
  const external = '{"fmode":false,"outside":true}';
  writeFileSync(path, external);
  await control.click();
  await browser.keys(Key.Escape);
  assert.equal(readFileSync(path, "utf8"), external);
  await openConflictReview(browser, ".lapis/app-shell-plugins.json");
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  await browser.$("button=Use disk version").click();
  await browser.waitUntil(
    async () =>
      !(await browser
        .$(conflictReview(".lapis/app-shell-plugins.json"))
        .isExisting()),
  );
  const recovered = await pluginSwitch(browser, "fmode");
  assert.equal(await recovered.getAttribute("aria-checked"), "false");
  await session.close();
  assert.equal(readFileSync(path, "utf8"), external);
});

test("Explorer note creation finishes before native close and restores its note", async (context) => {
  const { root, vault, session, browser } = await fixture(
    context,
    "create-close",
  );
  await browser.$('button[aria-label="Create File"]').waitForDisplayed();
  await browser.$('button[aria-label="Create File"]').click();
  await session.close();
  assert.equal(existsSync(join(vault, "Untitled.md")), true);
  const restored = await nativeSession("create-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const editor = restored.browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  assert.equal((await editor.getText()).trim(), "");
  const layout = JSON.parse(
    readFileSync(join(vault, ".lapis/workspace.json"), "utf8"),
  );
  const tabs = layout.main.children[0];
  const leaf = tabs.children[tabs.currentTab];
  assert.equal(leaf.state.state.file, "Untitled.md");
  assert.equal(layout.active, leaf.id);
  await restored.close();
});
