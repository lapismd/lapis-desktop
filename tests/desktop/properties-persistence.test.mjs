import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import {
  acceptConflictSide,
  saveConflictResult,
  nativeFailure,
  openConflictReview,
  reviewedText,
} from "./conflict-review.mjs";

import {
  originalPropertyText as original,
  propertiesFixture as fixture,
  setPropertyStatus as setStatus,
} from "./properties-driver.mjs";

test("Properties edits save before native close and restore with the panel on cold launch", async (context) => {
  const { root, file, session, browser, status } = await fixture(
    context,
    "properties-close",
  );
  await setStatus(browser, status, "done", false);
  await session.close();
  assert.match(readFileSync(file, "utf8"), /status: done/u);
  const restored = await nativeSession("properties-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const value = restored.browser.$(
    '[data-testid="file-properties-panel"] [aria-label="status value"]',
  );
  await value.waitForDisplayed();
  assert.equal(await value.getText(), "done");
  await restored.close();
});

test("a stale Properties record preserves external text and requires explicit recovery", async (context) => {
  const { file, session, browser, status } = await fixture(
    context,
    "properties-conflict",
  );
  const external = original.replace(
    "status: ready",
    "status: external\nowner: outside",
  );
  await setStatus(browser, status, "local", false);
  writeFileSync(file, external);
  await browser
    .$('[data-testid="file-properties-panel"] [aria-label="owner value"]')
    .waitForDisplayed();
  // This case targets the captured-frontmatter conflict after the independent
  // clean source editor has observed the external save. Earlier native Yield
  // refusal has its own Problems/protection acceptance.
  await browser.waitUntil(
    async () =>
      (await browser.execute(() =>
        globalThis.__lapisPluginAcceptance.fileText("Note.md"),
      )) === external,
  );
  assert.equal(
    await browser.execute(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "status value",
    "External reconciliation must retain the focused property draft",
  );
  assert.equal(
    await status().getText(),
    "local",
    "Metadata refresh must preserve the focused property draft",
  );
  await browser.keys(Key.Enter);
  await openConflictReview(browser, "Note.md");
  assert.equal(readFileSync(file, "utf8"), external);
  await reviewedText(browser, "Note.md", "Your version", "status: local");
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  await browser.$("button=Use disk version").click();
  await browser.waitUntil(
    async () => (await status().getText()) === "external",
  );
  assert.equal(readFileSync(file, "utf8"), external);
  await setStatus(browser, status, "after recovery");
  await session.close();
  const saved = readFileSync(file, "utf8");
  assert.match(saved, /status: after recovery/u);
  assert.match(saved, /owner: outside/u);
});

test("failed Properties writes prevent native close and retry after permissions recover", async (context) => {
  const { vault, file, session, browser, status } = await fixture(
    context,
    "properties-failure",
  );
  context.after(() => chmodSync(vault, 0o755));
  chmodSync(vault, 0o555);
  await setStatus(browser, status, "retained");
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(file, "utf8"), original);
  chmodSync(vault, 0o755);
  await openConflictReview(browser, "Note.md");
  await acceptConflictSide(browser, "Note.md", "Left");
  await saveConflictResult(browser, "Note.md");
  await browser.waitUntil(() =>
    /status: retained/u.test(readFileSync(file, "utf8")),
  );
  await session.close();
  assert.match(readFileSync(file, "utf8"), /status: retained/u);
});

test("the property type menu creates metadata state before close and restores it on cold launch", async (context) => {
  const { root, vault, session, browser } = await fixture(
    context,
    "metadata-type-close",
  );
  async function openTypes(driver) {
    await driver.$('button[aria-label="Property options for status"]').click();
    const trigger = driver.$('[role="menuitem"]*=Property type');
    await trigger.waitForDisplayed();
    await trigger.click();
    await driver.keys(Key.ArrowRight);
    await driver
      .$('[role="menu"][aria-label="Property type for status"]')
      .waitForDisplayed();
  }
  await openTypes(browser);
  await browser.$('[role="menuitemcheckbox"]*=Number').click();
  await session.close();
  const saved = JSON.parse(
    readFileSync(join(vault, ".lapis/types.json"), "utf8"),
  );
  assert.equal(saved.types.status, "number");
  const restored = await nativeSession("metadata-type-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser
    .$('[data-testid="file-properties-panel"]')
    .waitForDisplayed();
  await openTypes(restored.browser);
  assert.equal(
    await restored.browser
      .$('[role="menuitemcheckbox"]*=Number')
      .getAttribute("aria-checked"),
    "true",
  );
  await restored.browser.keys(["Escape", "Escape"]);
  await restored.close();
});
