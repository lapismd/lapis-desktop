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
const summary = 'button[aria-label^="Working copy details:"]';
const refresh = 'button[aria-label="Refresh working copy status"]';
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
async function expectFiles(browser, files) {
  await browser.$(summary).waitForDisplayed({ timeout: 30000 });
  try {
    await browser.waitUntil(
      async () =>
        (await browser.$(summary).getText()).includes(`${files} files`),
      { timeout: 30000 },
    );
  } catch (error) {
    console.error(
      "Working-copy UI diagnostic:",
      await browser.execute(() => document.body.innerText),
    );
    throw error;
  }
}

test("cold native working-copy status includes unsnapshotted files, refreshes, navigates and retains its visibility setting", async (context) => {
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
  await expectFiles(browser, 2);
  assert.match(await browser.$(summary).getText(), /\+3/);
  assert.match(await browser.$(summary).getText(), /-1/);
  await browser.$(summary).click();
  const card = browser.$('section[aria-label="Working copy details"]');
  await card.waitForDisplayed();
  assert.match(await card.getText(), /Native status revision/);
  assert.match(await card.getText(), /Includes unsnapshotted files/);
  await browser.$("button=Open in JJ Log").click();
  await browser
    .$('[aria-label="Repository history"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.waitUntil(async () =>
    (
      await browser
        .$('ol[aria-label="Revision graph"] button[aria-pressed="true"]')
        .getText()
    ).includes("Native status revision"),
  );
  writeFileSync(join(vault, "another.txt"), "Another file\n");
  await browser.$(refresh).click();
  await expectFiles(browser, 3);
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
  await expectFiles(cold.browser, 3);
  await cold.close(true);
  assert.deepEqual(
    sourceState(vault).filter(([name]) => name !== "/another.txt"),
    before,
    "Native status and settings cannot mutate source files, JJ objects or Git metadata",
  );
  assert.equal(
    readFileSync(join(vault, "another.txt"), "utf8"),
    "Another file\n",
  );
});
