import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import {
  distributionFixture,
  distributionCall,
  inspect,
  pluginCommand,
  setEnabled,
  stableTicks,
  persistedData,
  coldRestore,
} from "./distribution-driver.mjs";

test("signed native installation shares identities and safely updates, reloads and removes owned resources", async (context) => {
  const id = "native-lifecycle";
  const { root, vault, session, browser } = await distributionFixture(
    context,
    "signed-lifecycle",
  );
  const installed = await distributionCall(browser, "install", id, "1.0.0");
  assert.equal(installed.ok, true, JSON.stringify(installed));
  assert.equal(installed.value.restartRequired, false);
  const first = await inspect(browser, id);
  assert.equal(first.enabled, true, JSON.stringify(first));
  assert.equal(first.sharedApi, true);
  assert.equal(first.sharedSvelte, true);
  assert.equal(first.diagnostics.selectedRuntimeHost, "tauri-desktop");
  assert.equal(await pluginCommand(browser, id + ":version"), "1.0.0");
  await pluginCommand(browser, id + ":save");
  const saved = await persistedData(browser, vault, id);
  assert.deepEqual(JSON.parse(saved), { saved: "café 笔记", version: "1.0.0" });
  const preferences = readFileSync(
    join(vault, ".lapis/community-plugins.json"),
    "utf8",
  );
  const updated = await distributionCall(browser, "update", id, "2.0.0");
  assert.equal(updated.ok, true, JSON.stringify(updated));
  assert.equal(updated.value.installedVersion, "2.0.0");
  assert.equal(updated.value.restartRequired, true);
  const waiting = await inspect(browser, id);
  assert.equal(waiting.enabled, false);
  assert.equal(waiting.command, false);
  await stableTicks(browser, id);
  assert.equal(await setEnabled(browser, id, true), false);
  assert.equal(
    readFileSync(join(vault, ".lapis/plugins", id, "data.json"), "utf8"),
    saved,
  );
  assert.equal(
    readFileSync(join(vault, ".lapis/community-plugins.json"), "utf8"),
    preferences,
  );
  await session.close();

  const restored = await coldRestore(
    context,
    root,
    "signed-lifecycle-restored",
  );
  const next = restored.browser;
  const current = await inspect(next, id);
  assert.equal(current.record.installedVersion, "2.0.0");
  assert.equal(current.record.restartRequired, false);
  assert.equal(current.enabled, true, JSON.stringify(current));
  assert.equal(await pluginCommand(next, id + ":version"), "2.0.0");
  await next.$('button[aria-label="Open settings"]').click();
  await next.$("button=Core plugins").click();
  const row = `[data-settings-plugin-id="${id}"]`;
  await next.$(row).waitForDisplayed();
  await next.$(row + ' [role="switch"]').click();
  await next.waitUntil(async () => !(await inspect(next, id)).enabled);
  await stableTicks(next, id);
  await next.$(row + ' [role="switch"]').click();
  await next.waitUntil(async () => (await inspect(next, id)).enabled);
  await next.keys(Key.Escape);
  const removed = await distributionCall(next, "uninstall", id);
  assert.equal(removed.ok, true, JSON.stringify(removed));
  const absent = await inspect(next, id);
  assert.equal(absent.registered, false);
  assert.equal(absent.command, false);
  assert.equal(absent.record, null);
  assert.equal(absent.diagnostics, null);
  await stableTicks(next, id);
  assert.equal(
    existsSync(join(vault, ".lapis/plugins", id, "main.mjs")),
    false,
  );
  assert.equal(
    readFileSync(join(vault, ".lapis/plugins", id, "data.json"), "utf8"),
    saved,
  );
  await next.$('button[aria-label="Open settings"]').click();
  await next.$("button=Core plugins").click();
  await next.waitUntil(async () => !(await next.$(row).isExisting()));
  await next.keys(Key.Escape);
  await restored.close();
});

test("real signed Word Count installs through the Plugins screen and its public Settings switch owns cleanup", async (context) => {
  const { root, vault, session, browser } = await distributionFixture(
    context,
    "signed-wordcount",
  );
  const ribbon = browser.$('button[data-hint-target-id="ribbon:app:plugins"]');
  await ribbon.waitForDisplayed({ timeout: 10000 });
  await ribbon.click();
  await browser.$("a=Plugins").waitForDisplayed();
  await browser.$("a=Plugins").click();
  await browser
    .$('input[aria-label="Search registry plugins"]')
    .setValue("Word Count");
  await browser.$('a[aria-label="Open Word Count"]').waitForDisplayed();
  await browser.$('a[aria-label="Open Word Count"]').click();
  await browser.$("button=Install in Lapis").click();
  await browser.waitUntil(
    async () => (await inspect(browser, "wordcount")).enabled,
  );
  assert.equal(
    (await inspect(browser, "wordcount")).record.restartRequired,
    false,
  );
  await browser.$('[data-path="Note.md"]').click();
  await browser.waitUntil(() =>
    browser.execute(() => document.body.textContent.includes("3 words")),
  );
  assert.equal((await inspect(browser, "wordcount")).sharedApi, true);
  await browser.$('button[aria-label="Open settings"]').click();
  await browser.$("button=Core plugins").click();
  const toggle = '[data-settings-plugin-id="wordcount"] [role="switch"]';
  await browser.$(toggle).click();
  await browser.waitUntil(() =>
    browser.execute(() => !document.body.textContent.includes("3 words")),
  );
  await browser.$(toggle).click();
  await browser.waitUntil(() =>
    browser.execute(() => document.body.textContent.includes("3 words")),
  );
  await browser.keys(Key.Escape);
  await session.close();
  const restored = await coldRestore(
    context,
    root,
    "signed-wordcount-restored",
  );
  await restored.browser.waitUntil(() =>
    restored.browser.execute(() =>
      document.body.textContent.includes("3 words"),
    ),
  );
  assert.equal((await inspect(restored.browser, "wordcount")).enabled, true);
  const removed = await distributionCall(
    restored.browser,
    "uninstall",
    "wordcount",
    true,
  );
  assert.equal(removed.ok, true, JSON.stringify(removed));
  await restored.browser.waitUntil(() =>
    restored.browser.execute(
      () => !document.body.textContent.includes("3 words"),
    ),
  );
  assert.equal(existsSync(join(vault, ".lapis/plugins/wordcount")), false);
  await restored.close();
});
