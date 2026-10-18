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
const panel = '[aria-label="Repository history"]';
const operationSelect = `${panel} select[aria-label="Operation"]`;
const diff = `${panel} [aria-label="Changes to Note.md"]`;
const button = (browser, scope, text, partial = false) =>
  browser.$(scope).$(`button${partial ? "*" : ""}=${text}`);
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
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
async function openHistory(browser) {
  const button = browser.$('button[aria-label="Repository History"]');
  if (!(await button.isDisplayed()))
    await browser.$('button[aria-label="Open left sidebar"]').click();
  await button.waitForDisplayed();
  await button.click();
  await browser.$(panel).waitForDisplayed();
}
async function pinned(browser, expected) {
  await browser.waitUntil(
    async () =>
      (await browser.$(operationSelect).getValue()) === expected &&
      (await browser.$(panel).getAttribute("aria-busy")) === "false",
    {
      timeout: 30000,
      timeoutMsg: "Visible history must finish its exact operation pin",
    },
  );
  assert.match(
    await browser.$(`${panel} .repository-pin`).getText(),
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
  await button(browser, panel, "Native history second", true).click();
  await button(browser, panel, "Note.md").waitForDisplayed();
  await button(browser, panel, "Note.md").click();
  await browser.$(diff).waitForDisplayed({ timeout: 15000 });
  await browser.waitUntil(async () =>
    (await browser.$(diff).getText()).includes("Second committed text"),
  );
  assert.match(await browser.$(diff).getText(), /First committed text/);
}
async function selectOperation(browser, value) {
  // The embedded driver clicks options with el.click(), which WebKit ignores.
  // Exercise the mounted select's normal handler, without calling its controller.
  await browser.execute(
    (selector, value) => {
      const select = document.querySelector(selector);
      if (
        !(select instanceof HTMLSelectElement) ||
        select.disabled ||
        !Array.from(select.options).some((option) => option.value === value)
      )
        throw new Error("The visible operation must be selectable");
      select.value = value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    },
    operationSelect,
    value,
  );
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
  assert.equal(
    await button(first.browser, diff, "Unified").getAttribute("aria-pressed"),
    "true",
  );
  await first.browser.saveScreenshot(join(root, "history-unified.png"));
  await button(first.browser, diff, "Split").click();
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
  await button(first.browser, panel, "Refresh").click();
  await first.browser
    .$(`${operationSelect} option[value="${advanced}"]`)
    .waitForExist();
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
  await openHistory(second.browser);
  await second.browser.waitUntil(async () =>
    (await second.browser.$(panel).getText()).includes(
      "Repository history is unavailable for this vault",
    ),
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
