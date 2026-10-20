import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const panel = '[aria-label="Repository history"]';
const dialog = '[role="alertdialog"]';
const original = "# Original retained version — café 笔记\n";
const later = "# Later saved version\n";
async function session(context, name, root) {
  const active = await nativeSession(name, root);
  context.after(async () => {
    if (active.isRunning()) {
      writeFileSync(
        join(root, `${name}-body.txt`),
        await active.browser.execute(() => document.body.innerText),
      );
      await active.browser.saveScreenshot(join(root, `${name}-screen.png`));
    }
    await active.cleanup();
  });
  return active;
}
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
    .$("button*=Note.md");
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
function fixture(name) {
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, name));
  const vault = join(root, "Restore notes");
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  writeFileSync(
    join(vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: ["ai"], enabled: [] }),
  );
  writeFileSync(
    join(vault, ".lapis/retained-runtime.txt"),
    "Runtime data survives restoration\n",
  );
  writeFileSync(join(vault, "Note.md"), original);
  writeFileSync(join(vault, "Removed.md"), "Retain this original file\n");
  return { root, vault, file: join(vault, "Note.md") };
}
async function open(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await ready(session.browser);
}

test(
  "native UI rejects stale file previews and restores file/vault bytes with retained safety history",
  { timeout: 180000 },
  async (context) => {
    const { root, vault, file } = fixture("history-restore-");
    const first = await session(context, "restore-ui", root);
    const browser = first.browser;
    await open(first, root, vault);
    const initial = await checkpoint(browser);
    await browser.$('[data-path="Note.md"]').click();
    await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
    writeFileSync(file, later);
    rmSync(join(vault, "Removed.md"));
    writeFileSync(
      join(vault, "Extra.md"),
      "Created after the original checkpoint\n",
    );
    const changed = await checkpoint(browser, initial);
    await openHistory(browser);
    await previewFile(browser, initial);
    const intervening = "# External save after preview must survive\n";
    writeFileSync(file, intervening);
    await browser.$(dialog).$("button=Restore file").click();
    const failure = browser.$('[data-ui-part="toast"][role="alert"]');
    await failure.waitForDisplayed({ timeout: 30000 });
    assert.match(
      await failure.getText(),
      /The file changed since the restore preview; review it again/u,
    );
    assert.equal(readFileSync(file, "utf8"), intervening);
    assert.equal(
      await browser.$(dialog).isDisplayed(),
      true,
      "Stale previews remain reviewable",
    );
    await browser.$(dialog).$("button=Cancel").click();
    await browser.$(dialog).waitForDisplayed({ reverse: true });
    await previewFile(browser, initial);
    await confirm(browser, "Restore file");
    assert.equal(readFileSync(file, "utf8"), original);
    assert.equal(existsSync(join(vault, "Extra.md")), true);
    assert.equal(existsSync(join(vault, "Removed.md")), false);
    await browser.$('[data-path="Note.md"]').click();
    await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
    await browser.waitUntil(
      async () =>
        (
          await browser.$('.cm-content[contenteditable="true"]').getText()
        ).includes("Original retained version"),
      { timeout: 30000 },
    );
    await openHistory(browser);
    const repository = join(
      root,
      "vault-history",
      readdirSync(join(root, "vault-history"), { withFileTypes: true }).find(
        (entry) => entry.isDirectory(),
      ).name,
    );
    const receipts = join(repository, "restore-receipts");
    const receipt = JSON.parse(
      readFileSync(join(receipts, readdirSync(receipts)[0]), "utf8"),
    );
    assert.equal(receipt.request.checkpoint, initial);
    await selectRevision(browser, receipt.safety.commit);
    await browser
      .$(panel)
      .$('[aria-label="Changed files"]')
      .$("button*=Note.md")
      .click();
    const safetyDiff = browser.$(panel).$('[aria-label="Changes to Note.md"]');
    await safetyDiff.waitForDisplayed();
    assert.match(
      await safetyDiff.getText(),
      /External save after preview must survive/u,
      "The safety checkpoint retains the exact latest pre-restore bytes",
    );
    await selectRevision(browser, initial);
    await browser.$(panel).$("button=Restore vault…").click();
    await browser
      .$(dialog)
      .$("button=Restore vault")
      .waitForEnabled({ timeout: 30000 });
    assert.match(
      await browser.$(dialog).getText(),
      /1 files added,\s+0 changed and 1 removed/u,
    );
    await confirm(browser, "Restore vault");
    assert.equal(readFileSync(file, "utf8"), original);
    assert.equal(
      readFileSync(join(vault, "Removed.md"), "utf8"),
      "Retain this original file\n",
    );
    assert.equal(existsSync(join(vault, "Extra.md")), false);
    assert.equal(
      readFileSync(join(vault, ".lapis/retained-runtime.txt"), "utf8"),
      "Runtime data survives restoration\n",
    );
    await selectRevision(browser, changed);
    await browser
      .$(panel)
      .$('[aria-label="Changed files"]')
      .$("button*=Note.md")
      .click();
    const diff = browser.$(panel).$('[aria-label="Changes to Note.md"]');
    await diff.waitForDisplayed();
    assert.match(
      await diff.getText(),
      /Later saved version/u,
      "The pre-restore checkpoint remains readable",
    );
    await first.close(true);
    const cold = await session(context, "restore-ui-reopen", root);
    await ready(cold.browser);
    assert.equal(readFileSync(file, "utf8"), original);
    assert.equal(existsSync(join(vault, "Extra.md")), false);
    await cold.browser.$(panel).waitForDisplayed({ timeout: 30000 });
    await selectRevision(cold.browser, changed);
    writeFileSync(
      join(root, "restore-ui-receipt.json"),
      JSON.stringify({ initial, changed, restored: original }, null, 2) + "\n",
    );
    await cold.close();
  },
);

for (const kind of ["file", "vault"])
  test(
    `cold UI ${kind} restore recovery reconciles the original receipt without overwriting later edits`,
    { timeout: 180000 },
    async (context) => {
      const { root, vault, file } = fixture("history-restore-recovery-");
      const first = await session(context, "restore-recovery", root);
      const browser = first.browser;
      await open(first, root, vault);
      const initial = await checkpoint(browser);
      writeFileSync(file, later);
      await checkpoint(browser, initial);
      await openHistory(browser);
      if (kind === "file") await previewFile(browser, initial);
      else {
        await selectRevision(browser, initial);
        await browser.$(panel).$("button=Restore vault…").click();
        await browser
          .$(dialog)
          .$("button=Restore vault")
          .waitForEnabled({ timeout: 30000 });
      }
      writeFileSync(
        join(root, "restore-response-loss.arm"),
        "Drop the next confirmed restore response\n",
      );
      await browser.$(dialog).$(`button=Restore ${kind}`).click();
      const failure = browser.$('[data-ui-part="toast"][role="alert"]');
      await failure.waitForDisplayed({ timeout: 30000 });
      assert.match(
        await failure.getText(),
        /Acceptance restore response lost after native receipt/u,
      );
      assert.equal(readFileSync(file, "utf8"), original);
      const { request, scope } = JSON.parse(
        readFileSync(join(root, "restore-response-loss.receipt.json"), "utf8"),
      );
      assert.equal(scope, kind);
      assert.equal(request.checkpoint, initial);
      await browser.$(dialog).$("button=Cancel").click();
      const newer = "# Newer edit after the lost response\n";
      writeFileSync(file, newer);
      writeFileSync(
        join(vault, "After.md"),
        "Created after the interrupted restore\n",
      );
      const pending = () =>
        JSON.parse(
          readFileSync(join(vault, ".lapis/repository-history.json"), "utf8"),
        ).pendingRestore;
      assert.deepEqual(pending().request, request);
      await first.close(true);
      const cold = await session(context, "restore-recovery-reopen", root);
      await ready(cold.browser);
      await cold.browser.$(dialog).waitForDisplayed({ timeout: 30000 });
      assert.match(
        await cold.browser.$(dialog).getText(),
        /earlier restore was interrupted/u,
      );
      assert.deepEqual(pending().request, request);
      await confirm(cold.browser, `Restore ${kind}`);
      assert.equal(
        readFileSync(join(vault, "After.md"), "utf8"),
        "Created after the interrupted restore\n",
      );
      assert.equal(
        readFileSync(file, "utf8"),
        newer,
        "Receipt reconciliation cannot replay the mutation",
      );
      const data = JSON.parse(
        readFileSync(join(vault, ".lapis/repository-history.json"), "utf8"),
      );
      assert.equal(data.pendingRestore, null);
      writeFileSync(
        join(root, "restore-recovery-receipt.json"),
        JSON.stringify({ request, retained: newer }, null, 2) + "\n",
      );
      await cold.close();
    },
  );
