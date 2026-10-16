import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { nativeSession } from "./native-session.mjs";
import { focusNativeWindow } from "./native-visibility.mjs";

function receipts(root) {
  const path = join(root, "file-actions.jsonl");
  return existsSync(path)
    ? readFileSync(path, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(JSON.parse)
    : [];
}
function restoreFixture(receipt, original) {
  if (!receipt?.destination || existsSync(original)) return;
  execFileSync(
    "/usr/bin/swift",
    [
      "-e",
      "import Foundation; try FileManager.default.moveItem(at: URL(fileURLWithPath: CommandLine.arguments[1]), to: URL(fileURLWithPath: CommandLine.arguments[2]))",
      receipt.destination,
      original,
    ],
    { timeout: 30000, stdio: "pipe" },
  );
}
async function menu(browser, path) {
  await focusNativeWindow(browser);
  await browser.execute((path) => {
    const row = [...document.querySelectorAll("[data-path]")].find(
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
}

test("existing Explorer menus dispatch real macOS reveal, default open and system trash", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "system-actions-"),
  );
  const vault = join(root, "Native file actions vault");
  mkdirSync(vault);
  const note = join(vault, "Note.md");
  const content = "# Native system trash fixture\n";
  writeFileSync(note, content);
  const image = `Lapis Desktop Acceptance ${randomUUID()}.png`;
  copyFileSync("src-tauri/icons/icon.png", join(vault, image));
  const session = await nativeSession("system-actions", root);
  context.after(async () => {
    await session.cleanup();
    restoreFixture(
      receipts(root).find(
        (entry) =>
          entry.operation === "trash-system" && entry.path === "Note.md",
      ),
      note,
    );
  });
  const { browser } = session;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await menu(browser, "Note.md");
  const reveal = browser.$('[role="menuitem"]=Reveal in Finder');
  await reveal.waitForDisplayed({ timeout: 5000 });
  await reveal.click();
  await browser.waitUntil(() =>
    receipts(root).some(
      (entry) => entry.operation === "reveal-path" && entry.path === "Note.md",
    ),
  );
  await menu(browser, "Note.md");
  await browser.$('[role="menuitem"]=Delete').click();
  await browser.waitUntil(() => !existsSync(note));
  await browser.waitUntil(
    async () => !(await browser.$('[data-path="Note.md"]').isExisting()),
  );
  const trash = receipts(root).find(
    (entry) => entry.operation === "trash-system" && entry.path === "Note.md",
  );
  assert.ok(
    trash?.destination,
    "The actual OS trash provider returns a receipt",
  );
  assert.equal(existsSync(join(vault, ".trash", "Note.md")), false);
  await menu(browser, image);
  await browser.$('[role="menuitem"]=Open in default app').click();
  await browser.waitUntil(() =>
    receipts(root).some(
      (entry) => entry.operation === "open-path" && entry.path === image,
    ),
  );
  await session.close();
  restoreFixture(trash, note);
  assert.equal(readFileSync(note, "utf8"), content);
  console.log(`Native default-open fixture: ${join(vault, image)}`);
});
