import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
process.env.LAPIS_DESKTOP_ACCEPTANCE_NATIVE_AI = "1";
const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const panel = '[aria-label="Repository history"]';
const dialog = '[role="alertdialog"]';
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function checkpoint(browser, previous) {
  if (!(await browser.$(details).isDisplayed())) await browser.$(saved).click();
  let id;
  await browser.waitUntil(
    async () => {
      id = (
        await browser
          .$(details)
          .$('button[data-side="commit"]')
          .getAttribute("aria-label")
      )?.match(/Copy Git commit SHA ([0-9a-f]{40})$/u)?.[1];
      return id && id !== previous;
    },
    { timeout: 30000 },
  );
  await browser.$(saved).click();
  await browser.$(details).waitForDisplayed({ reverse: true });
  return id;
}
async function openHistory(browser) {
  await browser.$(saved).click();
  await browser.$(details).$("button=Open in JJ Log").click();
  await browser.$(panel).waitForDisplayed({ timeout: 30000 });
}
async function selectRevision(browser, id) {
  const selector = `${panel} ol[aria-label="Revision graph"] > li`;
  let index = -1;
  await browser.waitUntil(
    async () => {
      index = await browser.execute(
        (selector, id) =>
          Array.from(document.querySelectorAll(selector)).findIndex((row) =>
            row
              .querySelector(
                ':scope > .repository-graph-row button[data-side="commit"]',
              )
              ?.getAttribute("aria-label")
              ?.endsWith(`Copy Git commit SHA ${id}`),
          ),
        selector,
        id,
      );
      return index >= 0;
    },
    { timeout: 30000 },
  );
  const select = browser.$(
    `${selector}:nth-child(${index + 1}) > .repository-graph-row button.repository-graph-select`,
  );
  if ((await select.getAttribute("aria-expanded")) !== "true")
    await select.click();
  await select.waitUntil(
    async () => (await select.getAttribute("aria-expanded")) === "true",
  );
}

async function previewFile(browser, id) {
  console.log(`Preparing file restore from ${id}`);
  await selectRevision(browser, id);
  const file = browser
    .$(panel)
    .$('[aria-label="Changed files"]')
    .$("button*=transcript.jsonl");
  await file.waitForDisplayed({ timeout: 30000 });
  await file.click();
  const restore = browser
    .$(panel)
    .$('button[aria-label="Restore this file version"]');
  await restore.waitForDisplayed({ timeout: 30000 });
  // Column Canvas smoothly reveals the diff; use the final visible hit target.
  let position,
    stable = 0;
  await browser.waitUntil(
    async () => {
      const next = JSON.stringify(await restore.getLocation());
      stable = next === position ? stable + 1 : 0;
      position = next;
      return stable >= 2;
    },
    { timeout: 5000, interval: 100 },
  );
  await restore.click();
  await browser.$(dialog).waitForDisplayed();
  await browser
    .$(dialog)
    .$("button=Restore file")
    .waitForEnabled({ timeout: 30000 });
}
async function confirm(browser, label) {
  await browser.$(dialog).$(`button=${label}`).click();
  await browser.$(dialog).waitForDisplayed({ reverse: true, timeout: 30000 });
}

async function openChat(session, text) {
  const button = session.browser.$('button[aria-label="Open Chat"]');
  await button.waitForDisplayed();
  await button.click();
  const chat = session.browser.$('[data-testid="ai-chat-panel"]');
  await chat.waitForDisplayed();
  await session.browser.waitUntil(
    async () => (await chat.getText()).includes(text),
    { timeout: 30000 },
  );
  return chat;
}
test(
  "cold local ACP transcript backup, history diff, guarded restore and reopen without prompt replay",
  { timeout: 180000 },
  async (context) => {
    mkdirSync(".local/native-test", { recursive: true });
    const root = mkdtempSync(resolve(".local/native-test/transcript-backup-"));
    const vault = join(root, "Transcript Notes"),
      id = "7297795f-c00b-475e-b430-5b0e2e11a2e3";
    const directory = join(vault, `.lapis/agents/sessions/${id}`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(vault, "Welcome.md"), "# Local transcript backup\n");
    const now = new Date().toISOString();
    writeFileSync(
      join(directory, "metadata.yaml"),
      `schemaVersion: 1\nid: ${id}\ntitle: Backup conversation\ncreatedAt: '${now}'\nupdatedAt: '${now}'\nstatus: active\n`,
    );
    writeFileSync(join(directory, "agents.jsonl"), "");
    const record = (text, id) =>
      JSON.stringify({
        schemaVersion: 1,
        id,
        type: "message",
        role: "user",
        text,
        createdAt: now,
      }) + "\n";
    const initialText = record("Original local transcript", "original-user");
    const file = join(directory, "transcript.jsonl");
    writeFileSync(file, initialText);
    const retained = join(root, "profile/ai-backends-v1");
    mkdirSync(retained, { recursive: true });
    const sentinel = '{"native-selection":"preserve untouched"}\n';
    writeFileSync(join(retained, "retained.json"), sentinel);
    const first = await nativeSession("transcript-backup", root);
    context.after(first.cleanup);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first.browser);
    await openChat(first, "Original local transcript");
    const initial = await checkpoint(first.browser);
    writeFileSync(
      file,
      initialText + record("Later transcript saved externally", "later-user"),
    );
    await checkpoint(first.browser, initial);
    await openHistory(first.browser);
    await previewFile(first.browser, initial);
    const diff = await first.browser.$('[aria-label*="Changes to"]').getText();
    assert.match(diff, /Original local transcript/);
    await confirm(first.browser, "Restore file");
    assert.equal(readFileSync(file, "utf8"), initialText);
    await openChat(first, "Original local transcript");
    await first.close();
    const cold = await nativeSession("transcript-backup-cold", root);
    context.after(cold.cleanup);
    await ready(cold.browser);
    await openChat(cold, "Original local transcript");
    assert.equal(readFileSync(file, "utf8"), initialText);
    const workers = await cold.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("plugin:lapis-ai|list"),
    );
    assert.deepEqual(workers, []);
    assert.equal(
      existsSync(join(root, "acp-peer.jsonl")),
      false,
      "Reopening never executes a recorded prompt",
    );
    assert.equal(
      readFileSync(join(retained, "retained.json"), "utf8"),
      sentinel,
    );
    await cold.close();
    console.log(`Transcript backup evidence: ${root}`);
  },
);
