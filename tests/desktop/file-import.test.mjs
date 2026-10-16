import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function fixture(context) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "imports-"),
  );
  const vault = join(root, "Attachment import vault");
  mkdirSync(vault);
  mkdirSync(join(vault, "Attachments"));
  writeFileSync(
    join(vault, "Note.md"),
    "# Imported image\n\n![Imported attachment](Attachments/café.png)\n",
  );
  const session = await nativeSession("attachment-import", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  return { root, vault, session, browser };
}

async function drop(browser, name, bytes) {
  await browser.execute(
    (name, bytes) => {
      const target = document.querySelector('button[data-path="Attachments"]');
      const dataTransfer = new DataTransfer();
      if (name)
        dataTransfer.items.add(
          new File([new Uint8Array(bytes)], name, { type: "image/png" }),
        );
      target.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
    },
    name,
    bytes,
  );
}

async function imageReady(browser) {
  await browser.waitUntil(() =>
    browser.execute(() =>
      [...document.querySelectorAll(".notes-session img")].some(
        (image) =>
          image.currentSrc.startsWith("lapis-vault:") &&
          image.alt === "Imported attachment" &&
          image.naturalWidth > 0,
      ),
    ),
  );
}

async function errorNotice(browser, text) {
  await browser.waitUntil(() =>
    browser.execute(
      (text) =>
        [
          ...document.querySelectorAll(
            '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"]',
          ),
        ].some((toast) => toast.textContent.toLowerCase().includes(text)),
      text,
    ),
  );
}

test("existing Explorer drop imports binary attachments without replacing collisions and renders them after restart", async (context) => {
  const { root, vault, session, browser } = await fixture(context);
  const path = join(vault, "Attachments", "café.png");
  const bytes = readFileSync("src-tauri/icons/icon.png");
  await drop(browser, "", []);
  assert.deepEqual(readdirSync(join(vault, "Attachments")), []);
  await drop(browser, "café.png", [...bytes]);
  await browser.waitUntil(() => existsSync(path));
  await browser.$('[data-path="Attachments/café.png"]').waitForDisplayed();
  assert.deepEqual(readFileSync(path), bytes);
  await drop(browser, "café.png", [1, 2, 3]);
  await errorNotice(browser, "exist");
  assert.deepEqual(readFileSync(path), bytes);
  assert.deepEqual(readdirSync(join(vault, "Attachments")), ["café.png"]);
  await browser.$('[data-path="Note.md"]').click();
  await browser.$('button[aria-label="Open Note.md tab menu"]').click();
  await browser.$("span=Reading view").click();
  await imageReady(browser);
  await session.close();
  const restored = await nativeSession("attachment-import-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await imageReady(restored.browser);
  assert.deepEqual(readFileSync(path), bytes);
  await restored.close();
});

test("failed attachment import reports failure, preserves the folder and permits retry through immediate close", async (context) => {
  const { vault, session, browser } = await fixture(context);
  const folder = join(vault, "Attachments"),
    path = join(folder, "retry.png");
  context.after(() => chmodSync(folder, 0o755));
  chmodSync(folder, 0o555);
  await drop(browser, "retry.png", [0, 255, 128]);
  await errorNotice(browser, "permission");
  assert.equal(existsSync(path), false);
  assert.deepEqual(readdirSync(folder), []);
  chmodSync(folder, 0o755);
  await drop(browser, "retry.png", [0, 255, 128]);
  await session.close();
  assert.deepEqual([...readFileSync(path)], [0, 255, 128]);
  assert.deepEqual(readdirSync(folder), ["retry.png"]);
});
