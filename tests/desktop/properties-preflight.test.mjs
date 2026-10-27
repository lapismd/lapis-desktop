import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { Key } from "webdriverio";
import {
  originalPropertyText,
  propertiesFixture,
  setPropertyStatus,
} from "./properties-driver.mjs";
import { nativeFailure } from "./conflict-review.mjs";

const problem = "span*=Editing handoff failed:";
const probe = (browser, method, ...args) =>
  browser.execute(
    (method, args) => globalThis.__lapisTasksAcceptance[method](...args),
    method,
    args,
  );
async function source(browser) {
  return browser.execute(() =>
    globalThis.__lapisPluginAcceptance.fileText("Note.md"),
  );
}
async function retryAdmission(browser) {
  await browser.execute(() => {
    const row = [...document.querySelectorAll("span")].find((item) =>
      item.textContent?.startsWith("Editing handoff failed:"),
    );
    if (!row) throw Error("The captured failed handoff is unavailable");
    const rect = row.getBoundingClientRect();
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 10,
        clientY: rect.top + 8,
      }),
    );
  });
  const retry = browser.$('[role="menuitem"]=Retry editing admission');
  await retry.waitForDisplayed();
  await retry.click();
}

test("native Properties pre-Yield refusal retains Problems, protection and explicit retry without replay", async (context) => {
  const saved = new Map();
  for (const key of [
    "LAPIS_DESKTOP_METADATA_OWNER",
    "LAPIS_DESKTOP_EDITING_OWNER",
  ]) {
    saved.set(key, process.env[key]);
    process.env[key] = "core";
  }
  context.after(() => {
    for (const [key, value] of saved)
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  });
  const f = await propertiesFixture(context, "properties-preflight");
  const { browser, status } = f;
  const invoke = (command, args = {}) =>
    browser.execute(
      (command, args) => globalThis.__TAURI__.core.invoke(command, args),
      command,
      args,
    );
  const [recent] = await invoke("vault_recents");
  const observation = await invoke("vault_open_recent", {
    profileId: recent.id,
  });
  const editorState = async () =>
    (
      await invoke("vault_editing_intents", {
        sessionId: observation.sessionId,
        command: { kind: "list" },
      })
    ).states.filter((state) => state.path === "Note.md");
  await setPropertyStatus(browser, status, "local", false);
  await probe(browser, "holdFileReads", "Note.md");
  const external = originalPropertyText.replace(
    "status: ready",
    "status: external\nowner: outside",
  );
  writeFileSync(f.file, external);
  await browser.waitUntil(
    async () => (await probe(browser, "snapshot")).held === "read:Note.md",
  );
  assert.equal(await source(browser), originalPropertyText);
  assert.equal(await status().getText(), "local");
  const before = await editorState();
  assert.equal(before.length, 1);
  assert.equal(before[0].active, true);
  assert.equal(before[0].dirty, false);
  await browser.keys(Key.Enter);
  await browser.$('button[aria-label="Open command palette"]').click();
  const input = browser.$('[role="dialog"] input');
  await input.waitForDisplayed();
  await input.setValue("Show Problems");
  await browser.$('[role="option"]*=Problems').click();
  await browser.$(problem).waitForDisplayed();
  assert.equal(readFileSync(f.file, "utf8"), external);
  await browser.$('.cm-content[contenteditable="false"]').waitForDisplayed();
  assert.equal(await status().getText(), "local");
  const refused = await probe(browser, "snapshot");
  assert.deepEqual(
    await editorState(),
    before,
    "Pre-Yield refusal changes no native claim",
  );
  assert.equal(
    refused.writes.filter((write) => write.path === "Note.md").length,
    0,
  );
  await f.session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(f.session.isRunning(), true);
  assert.equal(readFileSync(f.file, "utf8"), external);
  await probe(browser, "release");
  await browser.waitUntil(async () => (await source(browser)) === external);
  await browser.$(problem).waitForDisplayed();
  await browser.$('.cm-content[contenteditable="false"]').waitForDisplayed();
  await retryAdmission(browser);
  await browser.$(problem).waitForDisplayed({ reverse: true });
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
  const after = await probe(browser, "snapshot");
  const recovered = await editorState();
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].editor_id, before[0].editor_id);
  assert.equal(recovered[0].active, true);
  assert.equal(recovered[0].dirty, false);
  assert.equal(
    after.writes.filter((write) => write.path === "Note.md").length,
    0,
  );
  assert.equal(readFileSync(f.file, "utf8"), external);
  await invoke("vault_close", { sessionId: observation.sessionId });
  await f.session.close();
  assert.equal(readFileSync(f.file, "utf8"), external);
});
