import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

function jj(root, ...args) {
  execFileSync(
    "/opt/homebrew/bin/jj",
    [
      "--no-pager",
      "--config",
      "user.name='Status fixture'",
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
      stdio: "pipe",
    },
  );
}
function sourceState(root) {
  const result = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".lapis") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else
        result.push([
          path.slice(root.length),
          createHash("sha256").update(readFileSync(path)).digest("hex"),
        ]);
    }
  }
  walk(root);
  return result.sort((a, b) => a[0].localeCompare(b[0]));
}
const summary = 'button[aria-label^="Vault history:"]';
const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const originalPanel =
  '[aria-label="Repository history"]:has(button[aria-label="History source: Original"])';
const refresh = 'button[aria-label="Save vault checkpoint now"]';
const setting =
  '[role="switch"][id="setting-repository-history.showWorkingCopyStatus"]';
async function openSettings(browser) {
  const open = browser.$('button[aria-label="Open settings"]');
  if (!(await open.isDisplayed()))
    await browser.$('button[aria-label="Open left sidebar"]').click();
  await open.click();
  await browser.$("button=Repository History").waitForDisplayed();
  await browser.$("button=Repository History").click();
  await browser.$(setting).waitForDisplayed();
}
async function checkpoint(browser, previous) {
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).click();
  const identifier = browser.$(details).$('button[data-side="commit"]');
  let commit;
  await browser.waitUntil(
    async () => {
      commit = (await identifier.getAttribute("aria-label"))?.match(
        /Copy Git commit SHA ([0-9a-f]{40})$/u,
      )?.[1];
      return commit && commit !== previous;
    },
    { timeout: 30000 },
  );
  await browser.$(saved).click();
  return commit;
}
async function originalHistory(browser) {
  await browser.$('button[aria-label="History source: Backup"]').click();
  const original = browser.$('[role="option"]*=Original repository');
  await original.waitForDisplayed();
  await original.click();
  await browser
    .$('button[aria-label="History source: Original"]')
    .waitForDisplayed();
}

test("native M14 backup status preserves an existing Original repository and restores visibility after cold reopen", async (context) => {
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "working-copy-"));
  const vault = join(root, "Status vault");
  mkdirSync(vault);
  jj(vault, "git", "init", "--colocate");
  writeFileSync(join(vault, ".gitignore"), ".lapis/\n");
  // Optional AI seeds real untracked skill files; this fixture isolates history.
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(
    join(vault, ".lapis/core-plugins.json"),
    JSON.stringify({ disabled: ["ai"], enabled: [] }),
  );
  writeFileSync(join(vault, "Note.md"), "# Recorded note\n");
  jj(vault, "describe", "-m", "Recorded parent");
  jj(vault, "new", "-m", "Native status revision");
  writeFileSync(join(vault, "Note.md"), "# Unsnapshotted note\nMore detail\n");
  writeFileSync(join(vault, "untracked.txt"), "New unsnapshotted file\n");
  const before = sourceState(vault);
  const session = await nativeSession("working-copy", root);
  context.after(session.cleanup);
  const browser = session.browser;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  // M14's native profile reports managed capture even when an independent
  // Original repository exists. Original unsnapshotted totals retain their
  // separate native admission assertions; this is the real status/sources UI.
  assert.equal(
    await browser.$('button[aria-label^="Working copy details:"]').isExisting(),
    false,
  );
  const initial = await checkpoint(browser);
  await browser.$(saved).click();
  const card = browser.$(details);
  await card.waitForDisplayed();
  assert.match(
    await card.getText(),
    /Saved editor and external file changes are captured automatically/,
  );
  await card.$("button=Open in JJ Log").click();
  await browser
    .$('[aria-label="Repository history"]')
    .waitForDisplayed({ timeout: 30000 });
  await originalHistory(browser);
  const revision = browser
    .$(`${originalPanel} ol[aria-label="Revision graph"]`)
    .$("button*=Native status revision");
  await revision.waitForDisplayed();
  await revision.click();
  await browser.waitUntil(async () =>
    (
      await browser
        .$(
          `${originalPanel} ol[aria-label="Revision graph"] button[aria-pressed="true"]`,
        )
        .getText()
    ).includes("Native status revision"),
  );
  writeFileSync(join(vault, "another.txt"), "Another file\n");
  await browser.$(refresh).click();
  const changed = await checkpoint(browser, initial);
  assert.notEqual(changed, initial);
  await openSettings(browser);
  assert.equal(await browser.$(setting).getAttribute("aria-checked"), "true");
  await browser.$(setting).click();
  await browser.waitUntil(async () => !(await browser.$(summary).isExisting()));
  await browser.keys(Key.Escape);
  await session.close(true);
  const cold = await nativeSession("working-copy-restored", root);
  context.after(cold.cleanup);
  await cold.browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  assert.equal(await cold.browser.$(summary).isExisting(), false);
  await openSettings(cold.browser);
  assert.equal(
    await cold.browser.$(setting).getAttribute("aria-checked"),
    "false",
  );
  await cold.browser.$(setting).click();
  await cold.browser.keys(Key.Escape);
  await checkpoint(cold.browser);
  await cold.close(true);
  assert.deepEqual(
    sourceState(vault).filter(([name]) => name !== "/another.txt"),
    before,
    "Managed backup status, Original reads and settings cannot mutate source files, JJ objects or Git metadata",
  );
  assert.equal(
    readFileSync(join(vault, "another.txt"), "utf8"),
    "Another file\n",
  );
});
