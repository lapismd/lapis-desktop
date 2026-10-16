import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Internal mutation vault");
  mkdirSync(vault);
  mkdirSync(join(vault, "Archive"));
  mkdirSync(join(vault, "Moved"));
  writeFileSync(join(vault, "Note.md"), "# Original note\n");
  writeFileSync(join(vault, "Keep.md"), "# Keep destination\n");
  writeFileSync(join(vault, "Archive", "Renamed.md"), "# Keep archive\n");
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Note.md"]').click();
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  return { root, vault, session, browser, editor };
}
async function edit(browser, editor, text) {
  await browser.waitUntil(
    async () => (await editor.getAttribute("contenteditable")) === "true",
  );
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(text);
  assert.equal(
    (await editor.getText()).trim(),
    text.trim(),
    "The ready editor must receive the requested input",
  );
}
async function rename(browser, path, name) {
  await browser.execute((path) => {
    const row = [...document.querySelectorAll("button[data-path]")].find(
      (row) => row.dataset.path === path,
    );
    const rect = row.getBoundingClientRect();
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: rect.left + 20,
        clientY: rect.top + 10,
      }),
    );
  }, path);
  await browser.$('[role="menuitem"]=Rename...').click();
  const input = browser.$('input[aria-label="Rename..."]');
  await input.waitForDisplayed();
  await input.setValue(name);
  await browser.keys(Key.Enter);
  await input.waitForExist({ reverse: true });
}
async function move(browser, path, folder) {
  await browser.execute(
    (path, folder) => {
      const target = [...document.querySelectorAll("button[data-path]")].find(
        (row) => row.dataset.path === folder,
      );
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", path);
      target.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
    },
    path,
    folder,
  );
}
async function notice(browser, text) {
  await browser.waitUntil(() =>
    browser.execute(
      (text) =>
        [
          ...document.querySelectorAll(
            '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"]',
          ),
        ].some((toast) => toast.textContent.includes(text)),
      text,
    ),
  );
}

test("Explorer rename and move preserve collisions, the active editor and restart layout", async (context) => {
  const { root, vault, session, browser, editor } = await fixture(
    context,
    "internal-mutations",
  );
  await rename(browser, "Note.md", "Keep.md");
  await notice(browser, "A file already exists at /Keep.md");
  assert.equal(
    readFileSync(join(vault, "Keep.md"), "utf8"),
    "# Keep destination\n",
  );
  assert.equal(
    readFileSync(join(vault, "Note.md"), "utf8"),
    "# Original note\n",
  );
  const draft = "# Saved through internal rename\n";
  await edit(browser, editor, draft);
  await rename(browser, "Note.md", "Renamed.md");
  await browser.$('[data-path="Renamed.md"]').waitForDisplayed();
  assert.equal(existsSync(join(vault, "Note.md")), false);
  assert.equal(readFileSync(join(vault, "Renamed.md"), "utf8"), draft);
  await move(browser, "Renamed.md", "Archive");
  await notice(browser, "A file already exists at Archive/Renamed.md");
  assert.equal(
    readFileSync(join(vault, "Archive", "Renamed.md"), "utf8"),
    "# Keep archive\n",
  );
  assert.equal(readFileSync(join(vault, "Renamed.md"), "utf8"), draft);
  await move(browser, "Renamed.md", "Moved");
  await browser.$('[data-path="Moved/Renamed.md"]').waitForDisplayed();
  const movedDraft = "# Saved through internal move\n";
  await edit(browser, editor, movedDraft);
  await browser.waitUntil(
    () =>
      readFileSync(join(vault, "Moved", "Renamed.md"), "utf8") === movedDraft,
  );
  assert.equal(existsSync(join(vault, "Renamed.md")), false);
  assert.equal(existsSync(join(vault, "Note.md")), false);
  await session.close();
  const restored = await nativeSession("internal-mutations-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const restoredEditor = restored.browser.$(
    '.cm-content[contenteditable="true"]',
  );
  await restoredEditor.waitForDisplayed();
  assert.ok(
    (await restoredEditor.getText()).includes("Saved through internal move"),
  );
  const layout = readFileSync(join(vault, ".lapis", "workspace.json"), "utf8");
  assert.ok(JSON.stringify(JSON.parse(layout)).includes("Moved/Renamed.md"));
  await restored.close();
});

for (const operation of ["rename", "move"]) {
  test(`Explorer ${operation} retains a conflicted dirty note before filesystem mutation`, async (context) => {
    const { vault, session, browser, editor } = await fixture(
      context,
      `dirty-internal-${operation}`,
    );
    const external = "# External retained bytes\n",
      draft = "# Retained local draft\n";
    writeFileSync(join(vault, "Note.md"), external);
    await edit(browser, editor, draft);
    await browser.$('[aria-label="File conflicts"]').waitForDisplayed();
    if (operation === "rename") await rename(browser, "Note.md", "Renamed.md");
    else await move(browser, "Note.md", "Moved");
    await notice(browser, "File changed on disk: Note.md");
    assert.equal(readFileSync(join(vault, "Note.md"), "utf8"), external);
    assert.equal(existsSync(join(vault, "Renamed.md")), false);
    assert.equal(existsSync(join(vault, "Moved", "Note.md")), false);
    assert.equal(
      await browser
        .$('textarea[aria-label="Your version of Note.md"]')
        .getValue(),
      draft,
    );
    await browser.$("button=Use disk version").waitForEnabled();
    await browser.$("button=Use disk version").click();
    await browser
      .$('[aria-label="File conflicts"]')
      .waitForExist({ reverse: true });
    if (operation === "rename") await rename(browser, "Note.md", "Renamed.md");
    else await move(browser, "Note.md", "Moved");
    const destination = operation === "rename" ? "Renamed.md" : "Moved/Note.md";
    await browser.$(`[data-path="${destination}"]`).waitForDisplayed();
    assert.equal(existsSync(join(vault, "Note.md")), false);
    assert.equal(readFileSync(join(vault, destination), "utf8"), external);
    await session.close();
  });
}
