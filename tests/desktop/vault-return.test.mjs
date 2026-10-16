import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";

test("the chooser returns to the previous vault after cancellation without retaining its old database", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "return-"),
  );
  const vault = join(root, "Return vault");
  mkdirSync(vault);
  const file = join(vault, "Welcome.md");
  writeFileSync(file, "# Return to this note\n");
  const session = await nativeSession("vault-return", root);
  context.after(session.cleanup);
  const { browser } = session;
  const close = () =>
    browser.$('button[aria-label="Return to previous vault"]');
  assert.equal(await close().isExisting(), false);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Welcome.md"]').click();
  const editor = () => browser.$('.cm-content[contenteditable="true"]');
  await editor().waitForDisplayed();
  await editor().click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor().addValue("# Preserved when returning\n");
  await returnToVaults(browser);
  await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
  assert.equal(readFileSync(file, "utf8"), "# Preserved when returning\n");
  assert.equal(await browser.$(".notes-session").isExisting(), false);
  assert.equal(
    await close().isExisting(),
    true,
    "Enable the existing chooser close button after leaving a vault",
  );
  await browser.execute(async () => {
    const { invoke } = globalThis.__TAURI__.core;
    const [profile] = await invoke("vault_recents");
    const selected = await invoke("vault_open_recent", {
      profileId: profile.id,
    });
    const { connectionId } = await invoke("vault_db_open", {
      sessionId: selected.sessionId,
    });
    await invoke("vault_db_close", {
      sessionId: selected.sessionId,
      connectionId,
    });
    await invoke("vault_close", { sessionId: selected.sessionId });
  });
  writeFileSync(join(root, "picker.json"), "null");
  await browser.$("button*=Open Vault").click();
  await browser.waitUntil(
    async () =>
      (await browser
        .$("[data-desktop-vault-launcher]")
        .getAttribute("aria-busy")) === "false",
  );
  assert.equal(await close().isDisplayed(), true);
  await close().click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await editor().waitForDisplayed();
  assert.ok((await editor().getText()).includes("Preserved when returning"));
  assert.equal(
    await browser.$("[data-desktop-vault-launcher]").isDisplayed(),
    false,
  );
  await session.close();
});
