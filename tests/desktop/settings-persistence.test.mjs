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
import {
  acceptConflictSide,
  saveConflictResult,
  conflictReview,
  nativeFailure,
  openConflictReview,
  reviewedText,
} from "./conflict-review.mjs";

const key = "workspace.mobile.showBottomNav";
const toggle = (browser) =>
  browser.$('[role="switch"][id="setting-workspace.mobile.showBottomNav"]');
async function settings(browser) {
  await browser.$('button[aria-label="Open settings"]').click();
  await toggle(browser).waitForDisplayed();
}
async function fixture(context, name, hotkeys = false) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Settings café");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "# Settings\n");
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(
    join(vault, ".lapis/app.json"),
    JSON.stringify({ [key]: true }),
  );
  if (hotkeys) {
    writeFileSync(
      join(vault, ".lapis/hotkeys.json"),
      JSON.stringify({ "app:go-to-file": [{ key: "F6", modifiers: [] }] }),
    );
  }
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  return {
    root,
    vault,
    path: join(vault, ".lapis/app.json"),
    session,
    browser: session.browser,
  };
}

test("existing Settings commits survive immediate native close and cold restoration", async (context) => {
  const { root, path, session, browser } = await fixture(
    context,
    "settings-close",
  );
  await settings(browser);
  assert.equal(await toggle(browser).getAttribute("aria-checked"), "true");
  await toggle(browser).click();
  await session.close();
  assert.equal(JSON.parse(readFileSync(path, "utf8"))[key], false);
  const restored = await nativeSession("settings-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await settings(restored.browser);
  assert.equal(
    await toggle(restored.browser).getAttribute("aria-checked"),
    "false",
  );
  await restored.close();
});

test("failed Settings persistence retains its draft and blocks native close until recovery", async (context) => {
  const { vault, path, session, browser } = await fixture(
    context,
    "settings-failure",
  );
  const directory = join(vault, ".lapis");
  context.after(() => chmodSync(directory, 0o700));
  await settings(browser);
  chmodSync(directory, 0o500);
  await toggle(browser).click();
  await browser.keys(Key.Escape);
  await openConflictReview(browser, ".lapis/app.json");
  await reviewedText(
    browser,
    ".lapis/app.json",
    "Your version",
    '"workspace.mobile.showBottomNav": false',
  );
  assert.equal(JSON.parse(readFileSync(path, "utf8"))[key], true);
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  chmodSync(directory, 0o700);
  await acceptConflictSide(browser, ".lapis/app.json", "Left");
  await saveConflictResult(browser, ".lapis/app.json");
  await browser.waitUntil(
    async () =>
      !(await browser.$(conflictReview(".lapis/app.json")).isExisting()),
  );
  await session.close();
  assert.equal(JSON.parse(readFileSync(path, "utf8"))[key], false);
});

test("stale Settings writes preserve external keys and explicit recovery restores the shared control", async (context) => {
  const { path, session, browser } = await fixture(
    context,
    "settings-conflict",
  );
  await settings(browser);
  const external = JSON.parse(readFileSync(path, "utf8"));
  external[key] = false;
  external.outside = "keep this key";
  const bytes = JSON.stringify(external, null, 2);
  writeFileSync(path, bytes);
  await toggle(browser).click();
  await browser.keys(Key.Escape);
  await openConflictReview(browser, ".lapis/app.json");
  assert.equal(readFileSync(path, "utf8"), bytes);
  await browser.$("button=Use disk version").click();
  await browser.waitUntil(
    async () =>
      !(await browser.$(conflictReview(".lapis/app.json")).isExisting()),
  );
  await settings(browser);
  assert.equal(await toggle(browser).getAttribute("aria-checked"), "false");
  await toggle(browser).click();
  await session.close();
  assert.equal(JSON.parse(readFileSync(path, "utf8"))[key], true);
  assert.equal(JSON.parse(readFileSync(path, "utf8")).outside, "keep this key");
});

test("cold startup loads the existing hotkey override into the normal workspace command", async (context) => {
  const { root, session, browser } = await fixture(
    context,
    "hotkeys-cold",
    true,
  );
  await browser.keys(Key.F6);
  await browser.$('[role="dialog"]').waitForDisplayed();
  assert.match(await browser.$('[role="dialog"]').getText(), /Note\.md/u);
  await session.close();
  const restored = await nativeSession("hotkeys-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.keys(Key.F6);
  await restored.browser.$('[role="dialog"]').waitForDisplayed();
  assert.match(
    await restored.browser.$('[role="dialog"]').getText(),
    /Note\.md/u,
  );
  await restored.close();
});
