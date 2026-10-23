import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";

function jj(root, ...args) {
  return execFileSync(
    "/opt/homebrew/bin/jj",
    [
      "--no-pager",
      "--config",
      "user.name='History fixture'",
      "--config",
      "user.email='fixture@invalid'",
      ...args,
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        JJ_CONFIG: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
      },
      encoding: "utf8",
    },
  ).trim();
}
const operation = (root) =>
  jj(
    root,
    "--ignore-working-copy",
    "--at-op=@",
    "op",
    "log",
    "--limit",
    "1",
    "--no-graph",
    "-T",
    "id",
  );
function sourceState(root) {
  const entries = [];
  function walk(relative) {
    const path = join(root, relative);
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = join(relative, entry.name);
      if (entry.isDirectory()) walk(name);
      else
        entries.push([
          name,
          createHash("sha256")
            .update(readFileSync(join(root, name)))
            .digest("hex"),
        ]);
    }
  }
  walk(".jj");
  walk(".git");
  for (const name of ["Note.md", "untracked.txt"])
    entries.push([name, readFileSync(join(root, name), "utf8")]);
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}
const historyPanel = 'section[aria-label="Repository history"][aria-busy]';
const panel = `${historyPanel}:has(button[aria-label="History source: Original"])`;
const operationSelect = `${panel} [role="combobox"][aria-label="Operation"]`;
const diff = `${panel} [aria-label="Changes to Note.md"]`;
const button = (browser, scope, text, partial = false) =>
  browser.$(scope).$(`button${partial ? "*" : ""}=${text}`);
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.waitUntil(
    async () => {
      const info = await browser.execute(() =>
        globalThis.__TAURI__.core.invoke("shell_info"),
      );
      return (
        JSON.stringify(info.nativeVisibility) ===
        JSON.stringify({ Ok: [true, false, true, true, true] })
      );
    },
    {
      timeout: 15000,
      timeoutMsg:
        "Native history requires a visible, unoccluded keyboard window on the current Space",
    },
  );
  assert.deepEqual(
    await browser.execute(async () => {
      const info = await globalThis.__TAURI__.core.invoke("shell_info");
      return info.nativeVisibility;
    }),
    { Ok: [true, false, true, true, true] },
    "Native history requires a visible, unoccluded keyboard window on the current Space",
  );
}
async function choose(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await ready(session.browser);
}
async function openHistory(browser, originalSource = true) {
  const button = browser.$('button[aria-label="Repository History"]');
  if (!(await button.isDisplayed()))
    await browser.$('button[aria-label="Open left sidebar"]').click();
  await button.waitForDisplayed();
  await button.click();
  await browser.$(historyPanel).waitForDisplayed();
  const source = browser.$('button[aria-label="History source: Backup"]');
  if (await source.isDisplayed()) {
    await source.click();
    if (!originalSource) return;
    const original = browser.$('[role="option"]*=Original repository');
    await original.waitForDisplayed();
    await original.click();
    await browser
      .$(`${panel} button[aria-label="History source: Original"]`)
      .waitForDisplayed();
  }
}
async function pinned(browser, expected) {
  await browser.waitUntil(
    async () =>
      (await browser.$(operationSelect).getAttribute("value")) === expected &&
      (await browser.$(panel).getAttribute("aria-busy")) === "false",
    {
      timeout: 30000,
      timeoutMsg: "Visible history must finish its exact operation pin",
    },
  );
  assert.match(
    await browser.$(operationSelect).getAttribute("title"),
    new RegExp(expected),
  );
}
async function inspectSecond(browser) {
  await button(
    browser,
    panel,
    "Native history second",
    true,
  ).waitForDisplayed();
  const revision = button(browser, panel, "Native history second", true);
  if ((await revision.getAttribute("aria-pressed")) !== "true")
    await revision.click();
  await button(browser, panel, "Note.md").waitForDisplayed();
  await button(browser, panel, "Note.md").click();
  await browser.$(diff).waitForDisplayed({ timeout: 15000 });
  await browser.waitUntil(async () =>
    (await browser.$(diff).getText()).includes("Second committed text"),
  );
  assert.match(await browser.$(diff).getText(), /First committed text/);
}
async function selectOperation(browser, value) {
  await browser.$(operationSelect).click();
  const row = browser.$(`[role="row"][aria-label="Select operation ${value}"]`);
  await row.waitForDisplayed();
  await row.click();
}

test("cold visible history preserves dirty source, exact pins and native restart recovery", async (context) => {
  assert.equal(process.platform, "darwin");
  assert.equal(process.arch, "arm64");
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "repository-visible-"));
  const vault = join(root, "JJ vault 笔记");
  mkdirSync(vault);
  jj(vault, "git", "init", "--colocate");
  writeFileSync(join(vault, ".gitignore"), ".lapis/\n");
  writeFileSync(join(vault, "Note.md"), "# First committed text\n");
  jj(vault, "describe", "-m", "Native history first");
  jj(vault, "new", "-m", "Native history second");
  writeFileSync(join(vault, "Note.md"), "# Second committed text\n");
  jj(vault, "describe", "-m", "Native history second");
  jj(vault, "new", "-m", "Native working revision");
  writeFileSync(join(vault, "Note.md"), "Unsnapshotted draft\n");
  writeFileSync(join(vault, "untracked.txt"), "Keep this unsnapshotted\n");
  const original = operation(vault);
  assert.match(original, /^[0-9a-f]{128}$/);
  const before = sourceState(vault);
  const first = await nativeSession("history-visible", root);
  context.after(first.cleanup);
  await choose(first, root, vault);
  await openHistory(first.browser);
  await pinned(first.browser, original);
  await inspectSecond(first.browser);
  await first.browser.$(`${panel} button[aria-label="Unified"]`).click();
  assert.equal(
    await first.browser
      .$(`${panel} button[aria-label="Unified"]`)
      .getAttribute("aria-checked"),
    "true",
  );
  await first.browser.saveScreenshot(join(root, "history-unified.png"));
  await first.browser.$(`${panel} button[aria-label="Split"]`).click();
  for (const label of ["Previous revision", "Later revision"])
    await first.browser.$(`${diff} [aria-label="${label}"]`).waitForDisplayed();
  assert.match(
    await first.browser.$(`${diff} [aria-label="Previous revision"]`).getText(),
    /First committed text/,
  );
  assert.match(
    await first.browser.$(`${diff} [aria-label="Later revision"]`).getText(),
    /Second committed text/,
  );
  await first.browser.saveScreenshot(join(root, "history-split.png"));
  assert.deepEqual(
    sourceState(vault),
    before,
    "Native history is read-only even with dirty notes",
  );

  jj(vault, "describe", "-m", "External history advance");
  const advanced = operation(vault);
  assert.notEqual(advanced, original);
  writeFileSync(join(vault, "Note.md"), "Dirty after external advance\n");
  const afterAdvance = sourceState(vault);
  await first.browser.$(`${panel} button[aria-label="Refresh"]`).click();
  await first.browser.$(operationSelect).click();
  await first.browser
    .$(`[role="row"][aria-label="Select operation ${advanced}"]`)
    .waitForDisplayed();
  await first.browser.$('button[aria-label="Close operation picker"]').click();
  await pinned(first.browser, original);
  assert.match(await first.browser.$(diff).getText(), /Second committed text/);
  await first.close();
  assert.deepEqual(sourceState(vault), afterAdvance);
  const saved = readFileSync(join(vault, ".lapis/workspace.json"), "utf8");
  assert.ok(
    saved.includes(original),
    "Close must persist the explicit historical pin",
  );

  const second = await nativeSession("history-visible-restored", root);
  context.after(second.cleanup);
  await ready(second.browser);
  await second.browser.$(panel).waitForDisplayed();
  await pinned(second.browser, original);
  await inspectSecond(second.browser);
  await second.browser.saveScreenshot(join(root, "history-restored.png"));
  await selectOperation(second.browser, advanced);
  await pinned(second.browser, advanced);
  assert.equal(
    await second.browser.$(diff).isExisting(),
    false,
    "Changing operation clears the old diff",
  );
  await button(
    second.browser,
    panel,
    "External history advance",
    true,
  ).waitForDisplayed();
  await button(second.browser, panel, "External history advance", true).click();
  await button(second.browser, panel, "Note.md").waitForDisplayed();
  await button(second.browser, panel, "Note.md").click();
  await second.browser.$(diff).waitForDisplayed();
  await second.browser.waitUntil(async () =>
    (await second.browser.$(diff).getText()).includes("Unsnapshotted draft"),
  );
  assert.equal(
    (await second.browser.$(diff).getText()).includes(
      "Dirty after external advance",
    ),
    false,
  );
  assert.deepEqual(sourceState(vault), afterAdvance);

  await returnToVaults(second.browser);
  await second.browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
  const plain = join(root, "Ordinary folder");
  mkdirSync(plain);
  writeFileSync(join(plain, "Note.md"), "Plain folder remains plain\n");
  await choose(second, root, plain);
  await openHistory(second.browser, false);
  await second.browser.waitUntil(async () =>
    (
      await second.browser
        .$('[aria-label="Select history source"][data-slot="popover-content"]')
        .getText()
    ).includes("Original repository unavailable"),
  );
  assert.equal(existsSync(join(plain, ".jj")), false);
  assert.equal(existsSync(join(plain, ".git")), false);
  assert.equal(
    readFileSync(join(plain, "Note.md"), "utf8"),
    "Plain folder remains plain\n",
  );
  await second.close();
  assert.deepEqual(sourceState(vault), afterAdvance);
  console.log(`Visible native history evidence: ${root}`);
});
