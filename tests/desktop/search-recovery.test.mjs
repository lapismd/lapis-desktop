import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { createNativeDatabaseProvider } from "../../src/lib/native/database/native-database-provider.ts";
import { normalRecovery } from "../../src/lib/notes/startup-recovery.ts";

test("an already selected native Search drains in a fresh safe-mode App and re-enables without changing saved settings", async (context) => {
  const previous = process.env.LAPIS_DESKTOP_METADATA_OWNER;
  process.env.LAPIS_DESKTOP_METADATA_OWNER = "core";
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
    else process.env.LAPIS_DESKTOP_METADATA_OWNER = previous;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/search-recovery-"));
  const vault = join(root, "Retained native Search recovery");
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  writeFileSync(join(vault, "Note.md"), "# Retained Search\n\norchard\n");
  writeFileSync(
    join(vault, ".lapis/hotkeys.json"),
    JSON.stringify({ "search:open-search": [{ key: "F6", modifiers: [] }] }),
  );
  const session = await nativeSession(
    "search-recovery",
    root,
    process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY,
  );
  let database;
  context.after(async () => {
    if (session.isRunning()) await database?.close().catch(() => {});
    await session.cleanup();
  });
  const { browser } = session;
  const call = (command, args = {}) =>
    browser.execute(
      (command, args) => globalThis.__TAURI__.core.invoke(command, args),
      command,
      args,
    );
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.keys(Key.F6);
  const panel = '[data-ui-component="search-panel"]';
  await browser.$(panel).waitForDisplayed();
  const input = () => browser.$(`${panel} .cm-content[contenteditable="true"]`);
  const query = async (value) => {
    await input().click();
    await browser.keys([Key.Command, "a"]);
    await browser.keys(Key.NULL);
    await input().addValue(value);
  };
  const result = (path) =>
    browser.$(
      `${panel} [role="treeitem"][aria-level="1"][aria-label*=" · ${path},"]`,
    );
  await query("orchard");
  await result("Note.md").waitForDisplayed({ timeout: 15000 });
  // An independent admitted observer inspects the same native owner; no App globals.
  const selected = await call("vault_restore");
  assert.ok(selected?.sessionId);
  database = await createNativeDatabaseProvider(
    selected,
    call,
    () => undefined,
  ).open({
    vaultId: selected.profileId,
    runtime: "tauri-desktop",
    role: "direct",
  });
  await assert.rejects(
    database.deleteSearchDocument("__recovery_probe_missing__.md"),
    /native|owner/u,
  );
  const appSettings = join(vault, ".lapis/app.json");
  await browser.waitUntil(() => {
    if (!existsSync(appSettings)) return false;
    return JSON.parse(
      readFileSync(appSettings, "utf8"),
    ).pluginData?.search?.view?.recentSearches?.includes("orchard");
  });
  const settings = ["app.json", "core-plugins.json"];
  const settingsBytes = () =>
    settings.map((path) => {
      const file = join(vault, ".lapis", path);
      return existsSync(file) ? readFileSync(file, "utf8") : null;
    });
  const before = settingsBytes();
  await browser.execute(
    (profileId, recovery) => {
      sessionStorage.setItem(
        `lapis.safeMode.session:${profileId}`,
        JSON.stringify(recovery),
      );
      window.__nativeSearchBeforeRecovery = true;
    },
    selected.profileId,
    { ...normalRecovery(), active: true, disableOptionalCorePlugins: true },
  );
  await browser.keys([Key.Command, "r"]);
  await browser.keys(Key.NULL);
  await browser.waitUntil(async () => {
    try {
      return await browser.execute(
        () => window.__nativeSearchBeforeRecovery !== true,
      );
    } catch {
      return false;
    }
  });
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[aria-label="Safe Mode"]').waitForDisplayed();
  assert.match(
    await browser.$('[aria-label="Safe Mode"]').getText(),
    /non-required core plugins disabled/u,
  );
  // Search ownership must have been explicitly released, not only its view hidden.
  await database.deleteSearchDocument("__recovery_probe_missing__.md");
  writeFileSync(join(vault, "SafeOnly.md"), "# Safe mode\n\norchard papaya\n");
  await browser.waitUntil(
    async () => Boolean(await database.getIndexedFile("SafeOnly.md")),
    { timeout: 15000 },
  );
  assert.equal(await database.getSearchDocument("SafeOnly.md"), undefined);
  await browser.$("button=Rebuild Search").click();
  await browser.waitUntil(async () =>
    (await browser.$('[aria-label="Safe Mode"]').getText()).includes(
      "Search index rebuilt",
    ),
  );
  assert.deepEqual(settingsBytes(), before);
  await browser.$("button=Restart normally").click();
  await browser.waitUntil(
    async () => !(await browser.$('[aria-label="Safe Mode"]').isExisting()),
  );
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.keys(Key.F6);
  await browser.$(panel).waitForDisplayed();
  await query("papaya");
  await result("SafeOnly.md").waitForDisplayed({ timeout: 15000 });
  await assert.rejects(
    database.deleteSearchDocument("__recovery_probe_missing__.md"),
    /native|owner/u,
  );
  await database.close();
  await call("vault_close", { sessionId: selected.sessionId, reload: true });
  await session.close();
});
