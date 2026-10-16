import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const panel = '[data-ui-component="search-panel"]';
const control = (browser, name) =>
  browser.$(panel).$(`label*=${name}`).$('[role="switch"]');
async function filters(browser) {
  await browser
    .$(`${panel} button[aria-label="Expand filter options"]`)
    .click();
  await control(browser, "Match case").waitForDisplayed();
}
async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Search settings vault");
  mkdirSync(vault);
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(join(vault, "Note.md"), "# Search\n\ntangerine\n");
  writeFileSync(
    join(vault, ".lapis/hotkeys.json"),
    JSON.stringify({ "search:open-search": [{ key: "F6", modifiers: [] }] }),
  );
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.keys(Key.F6);
  await browser.$(panel).waitForDisplayed();
  await browser
    .$(`${panel} .cm-content[contenteditable="true"]`)
    .addValue("tangerine");
  const path = join(vault, ".lapis/app.json");
  await browser.waitUntil(() =>
    JSON.parse(
      readFileSync(path, "utf8"),
    ).pluginData?.search?.view?.recentSearches?.includes("tangerine"),
  );
  await filters(browser);
  return { root, vault, path, browser, session };
}

test("Search controls persist through immediate native close and cold restoration", async (context) => {
  const { root, path, browser, session } = await fixture(
    context,
    "search-settings-close",
  );
  await control(browser, "Match case").click();
  await session.close();
  assert.equal(
    JSON.parse(readFileSync(path, "utf8")).pluginData.search.view.matchCase,
    true,
  );
  const restored = await nativeSession("search-settings-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$(panel).waitForDisplayed();
  await filters(restored.browser);
  assert.equal(
    await control(restored.browser, "Match case").getAttribute("aria-checked"),
    "true",
  );
  await restored.close();
});

test("Search settings preserve failed drafts and block native close until explicit retry", async (context) => {
  const { vault, path, browser, session } = await fixture(
    context,
    "search-settings-failure",
  );
  const directory = join(vault, ".lapis");
  context.after(() => chmodSync(directory, 0o700));
  chmodSync(directory, 0o500);
  await control(browser, "Match case").click();
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  assert.equal(
    JSON.parse(readFileSync(path, "utf8")).pluginData.search.view.matchCase,
    false,
  );
  await session.requestClose();
  await browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  chmodSync(directory, 0o700);
  await browser.$("button=Keep my version").click();
  await browser
    .$('[aria-label="File conflicts"]')
    .waitForExist({ reverse: true });
  await session.close();
  assert.equal(
    JSON.parse(readFileSync(path, "utf8")).pluginData.search.view.matchCase,
    true,
  );
});

test("Search disk recovery refreshes live controls before another settings write", async (context) => {
  const { vault, path, browser, session } = await fixture(
    context,
    "search-settings-conflict",
  );
  const external = JSON.parse(readFileSync(path, "utf8"));
  external.pluginData.search.view.matchCase = false;
  external.pluginData.search.view.showMoreContext = true;
  external.outside = "retained";
  const bytes = JSON.stringify(external, null, 2);
  const directory = join(vault, ".lapis");
  context.after(() => chmodSync(directory, 0o700));
  chmodSync(directory, 0o500);
  await control(browser, "Match case").click();
  await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
  writeFileSync(path, bytes);
  assert.equal(readFileSync(path, "utf8"), bytes);
  await session.requestClose();
  await browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  chmodSync(directory, 0o700);
  await browser.$("button=Check disk again").click();
  await browser.waitUntil(
    async () =>
      (await browser
        .$('textarea[aria-label="Disk version of .lapis/app.json"]')
        .getValue()) === bytes,
  );
  await browser.$("button=Use disk version").click();
  await browser
    .$('[aria-label="File conflicts"]')
    .waitForExist({ reverse: true });
  await browser.waitUntil(
    async () =>
      (await control(browser, "Show more context").getAttribute(
        "aria-checked",
      )) === "true",
  );
  assert.equal(
    await control(browser, "Match case").getAttribute("aria-checked"),
    "false",
  );
  await control(browser, "Collapse results").click();
  await session.close();
  const saved = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(saved.pluginData.search.view.matchCase, false);
  assert.equal(saved.pluginData.search.view.showMoreContext, true);
  assert.equal(saved.pluginData.search.view.collapseResults, false);
  assert.equal(saved.outside, "retained");
});
