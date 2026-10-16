import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  renameSync,
  existsSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const acceptance = process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT;
function fixture(name) {
  const root = mkdtempSync(join(acceptance, `${name}-`));
  const vault = join(root, "笔记 café");
  mkdirSync(vault);
  mkdirSync(join(vault, "Notes"));
  const file = join(vault, "Notes", "Daily.md");
  writeFileSync(file, "# Initial note\n");
  return { root, vault, file };
}
async function ready(session) {
  await session.browser.waitUntil(() =>
    session.browser.$('[data-notes-ready="true"]').isExisting(),
  );
}
async function choose(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button=Open vault…").click();
  await session.browser.waitUntil(
    async () =>
      (await session.browser.$(".vault-location").getText()) === vault &&
      (await session.browser.$("button=Open notes").isEnabled()),
  );
  await session.browser.$("button=Open notes").click();
  await ready(session);
}
async function openNote(session) {
  const { browser } = session;
  await browser.$('[data-path="Notes"]').click();
  await browser.$('[data-path="Notes/Daily.md"]').click();
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
}
async function edit(session, content) {
  const { browser } = session;
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(content);
}
async function editorText(session, content) {
  await session.browser.waitUntil(async () =>
    (
      await session.browser.$('.cm-content[contenteditable="true"]').getText()
    ).includes(content),
  );
}
async function returningToLauncher(session) {
  await session.browser.$("button=Back to vaults").click();
  await session.browser.$("button=Close vault").click();
}

test("cold Close and application Quit flush unsaved notes and restore the last vault and active note", async (context) => {
  const { root, vault, file } = fixture("notes-cold");
  const first = await nativeSession("first-close", root);
  context.after(first.cleanup);
  await choose(first, root, vault);
  await openNote(first);
  await edit(first, "# Saved by Close — café\n");
  await first.close();
  assert.equal(readFileSync(file, "utf8"), "# Saved by Close — café\n");
  const layout = JSON.parse(
    readFileSync(join(vault, ".lapis/workspace.json"), "utf8"),
  );
  assert.ok(JSON.stringify(layout).includes("Notes/Daily.md"));

  const second = await nativeSession("restored-quit", root);
  context.after(second.cleanup);
  await ready(second);
  await editorText(second, "Saved by Close — café");
  await edit(second, "# Saved by Quit — 笔记\n");
  await second.close(true);
  assert.equal(readFileSync(file, "utf8"), "# Saved by Quit — 笔记\n");

  const third = await nativeSession("restored-again", root);
  context.after(third.cleanup);
  await ready(third);
  await editorText(third, "Saved by Quit — 笔记");
  await returningToLauncher(third);
  await third.close();
  const fourth = await nativeSession("launcher-restored", root);
  context.after(fourth.cleanup);
  await fourth.browser.$("button=Open vault…").waitForDisplayed();
  assert.equal(
    await fourth.browser.$('[data-notes-ready="true"]').isExisting(),
    false,
  );
  await fourth.close();
});

test("failed note saves block native close, retain the dirty editor and permit retry", async (context) => {
  const { root, vault, file } = fixture("blocked-save");
  const session = await nativeSession("blocked-close", root);
  context.after(session.cleanup);
  context.after(() => chmodSync(join(vault, "Notes"), 0o755));
  await choose(session, root, vault);
  await openNote(session);
  chmodSync(join(vault, "Notes"), 0o555);
  await edit(session, "# Dirty text must survive\n");
  await session.requestClose();
  await session.browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(file, "utf8"), "# Initial note\n");
  await editorText(session, "Dirty text must survive");
  assert.equal(
    await session.browser.$('[data-notes-ready="true"]').isExisting(),
    true,
  );
  chmodSync(join(vault, "Notes"), 0o755);
  await session.close();
  assert.equal(readFileSync(file, "utf8"), "# Dirty text must survive\n");
});

test("failed layout saves block reload; repaired reload restores in the same native process", async (context) => {
  const { root, vault } = fixture("reload");
  const session = await nativeSession("reload", root);
  context.after(session.cleanup);
  await choose(session, root, vault);
  await openNote(session);
  const layout = join(vault, ".lapis/workspace.json");
  if (existsSync(layout)) rmSync(layout);
  mkdirSync(layout);
  const pid = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  await session.browser.execute(() => {
    document.documentElement.dataset.reloadProbe = "old-document";
  });
  await session.browser.$("button=Reload notes").click();
  await session.browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  assert.equal(session.isRunning(), true);
  assert.equal(
    await session.browser.execute(
      () => document.documentElement.dataset.reloadProbe,
    ),
    "old-document",
  );
  rmSync(layout, { recursive: true });
  await session.browser.$("button=Reload notes").click();
  await session.browser.waitUntil(() =>
    session.browser.execute(
      () => !document.documentElement.dataset.reloadProbe,
    ),
  );
  await ready(session);
  await editorText(session, "Initial note");
  const reloaded = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  assert.equal(reloaded.processId, pid.processId);
  await returningToLauncher(session);
  await session.close();
});

test("failed physical-root restoration stays visible and preserves the recovery profile", async (context) => {
  const { root, vault } = fixture("missing-vault");
  const first = await nativeSession("save-profile", root);
  context.after(first.cleanup);
  await choose(first, root, vault);
  await first.close();
  const saved = readFileSync(join(root, "profile/last-notes.json"), "utf8");
  renameSync(vault, `${vault}-moved`);
  const second = await nativeSession("missing-profile", root);
  context.after(second.cleanup);
  await second.browser.$('.shell-failure[role="alert"]').waitForDisplayed();
  await second.browser.$("button=Open vault…").waitForDisplayed();
  assert.equal(
    readFileSync(join(root, "profile/last-notes.json"), "utf8"),
    saved,
  );
  renameSync(`${vault}-moved`, vault);
  await second.browser.$(".vault-recents button").click();
  await second.browser.$("button=Open notes").click();
  await ready(second);
  await returningToLauncher(second);
  await second.close();
});

test("repeated vault switching saves pending edits, releases each old database and mounts only the selected vault", async (context) => {
  const { root, vault } = fixture("switching");
  const other = join(root, "Other vault");
  mkdirSync(other);
  writeFileSync(join(vault, "First only.md"), "First\n");
  writeFileSync(join(other, "Second only.md"), "Second\n");
  const session = await nativeSession("switching", root);
  context.after(session.cleanup);
  let switchCount = 0;
  for (const target of [vault, other, vault, other, vault]) {
    await choose(session, root, target);
    const first = target === vault;
    const note = `${first ? "First" : "Second"} only.md`;
    await session.browser
      .$(`[data-path="${first ? "First" : "Second"} only.md"]`)
      .waitForDisplayed();
    assert.equal(
      await session.browser
        .$(`[data-path="${first ? "Second" : "First"} only.md"]`)
        .isExisting(),
      false,
    );
    await session.browser.$(`[data-path="${note}"]`).click();
    const content = `# Saved before switch ${++switchCount}\n`;
    await edit(session, content);
    await session.browser.$("button=Back to vaults").click();
    await session.browser.$("button=Open notes").waitForDisplayed();
    assert.equal(await session.browser.$(".notes-session").isExisting(), false);
    assert.equal(readFileSync(join(target, note), "utf8"), content);
    const released = await session.browser.execute(async () => {
      const { invoke } = globalThis.__TAURI__.core;
      const [recent] = await invoke("vault_recents");
      const selected = await invoke("vault_open_recent", {
        profileId: recent.id,
      });
      const { connectionId } = await invoke("vault_db_open", {
        sessionId: selected.sessionId,
      });
      await invoke("vault_db_close", {
        sessionId: selected.sessionId,
        connectionId,
      });
      await invoke("vault_close", { sessionId: selected.sessionId });
      return true;
    });
    assert.equal(released, true);
  }
  await session.browser.$("button=Close vault").click();
  await session.close();
});

test("a broken saved layout reports startup failure and allows a return to vaults", async (context) => {
  const { root, vault, file } = fixture("broken-layout");
  mkdirSync(join(vault, ".lapis"));
  const layout = join(vault, ".lapis/workspace.json");
  writeFileSync(layout, "not a layout");
  const session = await nativeSession("broken-layout", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button=Open vault…").click();
  await session.browser.$("button=Open notes").click();
  await session.browser.$('.notes-session [role="alert"]').waitForDisplayed();
  assert.equal(
    await session.browser.$('[data-notes-ready="true"]').isExisting(),
    false,
  );
  await returningToLauncher(session);
  assert.equal(readFileSync(layout, "utf8"), "not a layout");
  assert.equal(readFileSync(file, "utf8"), "# Initial note\n");
  await session.close();
});
