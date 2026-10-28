import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";

async function claimAction(browser, name) {
  await browser.execute(() => {
    const message = [...document.querySelectorAll("span")].find((element) =>
      element.textContent?.trim().startsWith("Unresolved editing claim."),
    );
    if (!message) throw Error("The retained editing problem is unavailable");
    const rect = message.getBoundingClientRect();
    message.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 10,
        clientY: rect.top + 8,
      }),
    );
  });
  const action = browser.$(`[role="menuitem"]=${name}`);
  await action.waitForDisplayed();
  await action.click();
}

test("native retained claims refuse leave and recover through the mounted Problems panel", async (context) => {
  const previous = process.env.LAPIS_DESKTOP_EDITING_OWNER;
  process.env.LAPIS_DESKTOP_EDITING_OWNER = "core";
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_EDITING_OWNER;
    else process.env.LAPIS_DESKTOP_EDITING_OWNER = previous;
  });
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "editing-recovery-"),
  );
  const vault = join(root, "Editing café 笔记");
  mkdirSync(vault);
  const note = join(vault, "Note.md");
  const saved = join(vault, "Saved.md");
  writeFileSync(note, "# Original note\n");
  writeFileSync(saved, "# Saved recovery file\n\nAuthoritative disk text.\n");
  const session = await nativeSession("editing-recovery", root);
  const { browser } = session;
  context.after(async () => {
    try {
      if (session.isRunning())
        writeFileSync(
          join(root, "recovery-body.txt"),
          await browser.execute(() => document.body.innerText),
        );
    } finally {
      await session.cleanup();
    }
  });
  const call = (command, args = {}) =>
    browser.execute(
      async (command, args) => {
        try {
          return {
            value: await globalThis.__TAURI__.core.invoke(command, args),
          };
        } catch (error) {
          return {
            failure: {
              code: error?.code,
              message: String(error?.message ?? error),
            },
          };
        }
      },
      command,
      args,
    );
  const invoke = async (command, args) => {
    const reply = await call(command, args);
    assert.equal(reply.failure, undefined, JSON.stringify(reply.failure));
    return reply.value;
  };
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  assert.equal((await invoke("shell_info")).editingOwner, "core");
  await browser.$('button[aria-label="Open command palette"]').click();
  const search = browser.$('[role="dialog"] input');
  await search.waitForDisplayed();
  await search.setValue("Show Problems");
  await browser.$('[role="option"]*=Problems').click();
  assert.doesNotMatch(
    await browser.execute(() => document.body.innerText),
    /Failed to enable plugin/,
    "Selecting native editing must preserve the complete bundled app profile",
  );
  await browser.$('[data-path="Note.md"]').click();
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  const [recent] = await invoke("vault_recents");
  const foreign = await invoke("vault_open_recent", { profileId: recent.id });
  const blocked = await call("vault_fs", {
    sessionId: foreign.sessionId,
    request: {
      operation: "write-text-if-unchanged",
      path: "Note.md",
      data: "unsafe foreign replacement",
      expected: "# Original note\n",
    },
  });
  assert.equal(blocked.failure?.code, "EBUSY");
  const editor_id = crypto.randomUUID();
  const intent = (command, selected = foreign) =>
    invoke("vault_editing_intents", { sessionId: selected.sessionId, command });
  await intent({ kind: "acquire", editor_id, path: "Saved.md" });
  await intent({ kind: "changed", editor_id, generation: 1, revision: 1 });
  await invoke("vault_close", { sessionId: foreign.sessionId, reload: true });
  const probe = await invoke("vault_open_recent", { profileId: recent.id });
  const retained = async () =>
    (await intent({ kind: "list" }, probe)).states.find(
      (state) => state.editor_id === editor_id,
    );
  assert.equal((await retained()).detached, true);
  await returnToVaults(browser);
  const failure = browser.$(
    '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"][role="alert"]',
  );
  await failure.waitForDisplayed();
  assert.match(await failure.getText(), /Unresolved editing claims/);
  assert.equal(await editor.isExisting(), true);
  assert.equal(session.isRunning(), true);
  const problem = browser.$("span*=Unresolved editing claim.");
  await problem.waitForDisplayed();
  await claimAction(browser, "Review saved file");
  await browser.$("h1=Saved recovery file").waitForDisplayed();
  assert.equal(
    readFileSync(saved, "utf8"),
    "# Saved recovery file\n\nAuthoritative disk text.\n",
  );
  await claimAction(browser, "Recover editing claim");
  await browser.waitUntil(async () => (await retained())?.detached === false);
  assert.equal((await retained()).dirty, true);
  await claimAction(browser, "Discard editing claim");
  await browser.waitUntil(async () => (await retained()) === undefined);
  await problem.waitForDisplayed({ reverse: true });
  assert.equal(
    readFileSync(saved, "utf8"),
    "# Saved recovery file\n\nAuthoritative disk text.\n",
  );
  await invoke("vault_close", { sessionId: probe.sessionId });
  await browser.$('[data-path="Note.md"]').click();
  await editor.waitForDisplayed();
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue("# Saved after native recovery\n");
  await returnToVaults(browser);
  await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
  assert.equal(readFileSync(note, "utf8"), "# Saved after native recovery\n");
  await session.close();
});
