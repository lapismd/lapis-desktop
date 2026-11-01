import { fixtureJjBinary } from "./native-tools.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const adoption = 'section[aria-label="Original repository history"]';
const panel = '[aria-label="Repository history"]';
const graph = 'ol[aria-label="Revision graph"] > li';
const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
function jj(root, ...args) {
  return execFileSync(
    fixtureJjBinary(),
    [
      "--no-pager",
      "--config",
      "user.name='Adoption fixture'",
      "--config",
      "user.email='fixture@invalid'",
      ...args,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        JJ_CONFIG: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
      },
    },
  ).trim();
}
function sourceState(root) {
  const entries = [];
  function walk(relative) {
    for (const entry of readdirSync(join(root, relative), {
      withFileTypes: true,
    })) {
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
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}
async function session(context, name, root) {
  const active = await nativeSession(name, root);
  context.after(async () => {
    try {
      if (active.isRunning()) {
        writeFileSync(
          join(root, `${name}-body.txt`),
          await active.browser.execute(() => document.body.innerText),
        );
        writeFileSync(
          join(root, `${name}-source-picker.html`),
          await active.browser.execute(() =>
            [
              ...document.querySelectorAll(
                '[aria-label="Select history source"], [role="option"]',
              ),
            ]
              .map((element) => element.outerHTML)
              .join("\n"),
          ),
        );
        await active.browser.saveScreenshot(join(root, `${name}-screen.png`));
      }
    } finally {
      await active.cleanup();
    }
  });
  return active;
}
async function ready(browser) {
  await browser
    .$('[data-notes-ready="true"]')
    .waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function settings(browser) {
  for (const control of await browser.$$(
    'button[aria-label="Open settings"]',
  )) {
    if (await control.isDisplayed()) {
      await control.click();
      break;
    }
  }
  await browser.$("button=Repository History").waitForDisplayed();
  await browser.$("button=Repository History").click();
  await browser.$(adoption).waitForDisplayed({ timeout: 15000 });
}
async function activePanel(browser) {
  for (const region of await browser.$$(panel)) {
    if (await region.isDisplayed()) return region;
  }
  throw new Error("The selected history tab must be visible");
}
async function recordedRow(browser, commit) {
  let found;
  await browser.waitUntil(
    async () => {
      const region = await activePanel(browser);
      for (const row of await region.$$(graph)) {
        const copy = row.$(
          ':scope > .repository-graph-row button[data-side="commit"]',
        );
        if (
          (await copy.isExisting()) &&
          (await copy.getAttribute("aria-label"))?.endsWith(commit)
        ) {
          found = row;
          return true;
        }
      }
      return false;
    },
    { timeout: 30000, timeoutMsg: `Recorded ancestry ${commit} is visible` },
  );
  return found;
}
async function inspectRecordedDiff(browser, commit) {
  const row = await recordedRow(browser, commit);
  const select = row.$("button.repository-graph-select");
  if ((await select.getAttribute("aria-pressed")) !== "true")
    await select.click();
  const region = await activePanel(browser);
  const changed = region.$('[aria-label="Changed files"]');
  await changed.waitForDisplayed({ timeout: 15000 });
  const note = changed.$("button=Note.md");
  await note.waitForDisplayed({ timeout: 15000 });
  const diff = region.$('[aria-label="Changes to Note.md"]');
  if (!(await diff.isDisplayed())) await note.click();
  await diff.waitForDisplayed({ timeout: 15000 });
  await browser.waitUntil(
    async () => (await diff.getText()).includes("Second recorded content"),
    { timeout: 15000 },
  );
  assert.match(await diff.getText(), /First recorded content/);
  assert.equal((await diff.getText()).includes("Current editor draft"), false);
}
async function chooseSource(browser, label) {
  const region = await activePanel(browser);
  await region.$('button[aria-label^="History source:"]').click();
  const picker = browser.$('[aria-label="Select history source"]');
  await picker.waitForDisplayed();
  let selected;
  await browser.waitUntil(
    async () => {
      for (const option of await picker.$$('[role="option"]')) {
        if ((await option.getText()).trimStart().startsWith(label)) {
          selected = option;
          return true;
        }
      }
      return false;
    },
    { timeout: 15000, timeoutMsg: `History source ${label} is selectable` },
  );
  await selected.click();
  await picker.waitForDisplayed({ reverse: true });
  await browser.waitUntil(
    async () =>
      (await (await activePanel(browser))
        .$('button[aria-label^="History source:"]')
        .getAttribute("aria-label")) ===
      `History source: ${label === "Original repository" ? "Original" : "Backup"}`,
    { timeout: 15000 },
  );
}

test(
  "cold native adoption imports recorded ancestry without changing the original repository or current files",
  { timeout: 180000 },
  async (context) => {
    const base = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(base, { recursive: true });
    const root = mkdtempSync(join(base, "adoption-ui-"));
    const vault = join(root, "Original JJ café");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    jj(vault, "git", "init", "--colocate");
    writeFileSync(join(vault, ".gitignore"), ".lapis/\n");
    const file = join(vault, "Note.md");
    writeFileSync(file, "# First recorded content\n");
    jj(vault, "describe", "-m", "Original recorded baseline");
    jj(vault, "new", "-m", "Original recorded update");
    writeFileSync(file, "# Second recorded content\n");
    jj(vault, "describe", "-m", "Original recorded update");
    const commit = jj(
      vault,
      "--ignore-working-copy",
      "log",
      "-r",
      "@",
      "--no-graph",
      "-T",
      "commit_id",
    );
    jj(vault, "new", "-m", "Independent original working revision");
    writeFileSync(file, "# Unsnapshotted current file\n");
    writeFileSync(
      join(vault, "untracked.txt"),
      "Unsnapshotted independent file\n",
    );
    const original = sourceState(vault);
    const first = await session(context, "adoption-ui", root);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first.browser);
    await first.browser.$('[data-path="Note.md"]').click();
    const editor = first.browser.$('.cm-content[contenteditable="true"]');
    await editor.waitForDisplayed();
    await editor.click();
    await first.browser.keys([Key.Command, "a"]);
    await first.browser.keys(Key.NULL);
    const current = "# Current editor draft — preserved on import\n";
    await editor.addValue(current);
    await settings(first.browser);
    const importButton = first.browser
      .$(adoption)
      .$("button=Import recorded history");
    await importButton.waitForEnabled({ timeout: 15000 });
    await importButton.click();
    await first.browser.waitUntil(
      async () => {
        const region = first.browser.$(adoption);
        const settled = region.$("button=Import recorded history");
        return (
          (await region.getAttribute("aria-busy")) === "false" &&
          (await settled.isDisplayed()) &&
          (await settled.isEnabled())
        );
      },
      { timeout: 30000 },
    );
    await first.browser.$('button[aria-label="Close settings"]').click();
    await first.browser.$(adoption).waitForDisplayed({ reverse: true });
    await first.browser.$(saved).waitForDisplayed({ timeout: 30000 });
    await first.browser.$(saved).click();
    await first.browser.$(details).$("button=Open in JJ Log").click();
    await inspectRecordedDiff(first.browser, commit);
    assert.equal(readFileSync(file, "utf8"), current);
    assert.equal(
      readFileSync(join(vault, "untracked.txt"), "utf8"),
      "Unsnapshotted independent file\n",
    );
    assert.deepEqual(sourceState(vault), original);
    await chooseSource(first.browser, "Original repository");
    await inspectRecordedDiff(first.browser, commit);
    await chooseSource(first.browser, "Automatic vault history");
    await inspectRecordedDiff(first.browser, commit);
    await first.close(true);
    assert.deepEqual(sourceState(vault), original);

    const cold = await session(context, "adoption-ui-reopen", root);
    await ready(cold.browser);
    await inspectRecordedDiff(cold.browser, commit);
    await chooseSource(cold.browser, "Original repository");
    await inspectRecordedDiff(cold.browser, commit);
    assert.equal(readFileSync(file, "utf8"), current);
    assert.equal(
      readFileSync(join(vault, "untracked.txt"), "utf8"),
      "Unsnapshotted independent file\n",
    );
    assert.deepEqual(sourceState(vault), original);
    await cold.close(true);
    assert.deepEqual(sourceState(vault), original);
    writeFileSync(
      join(root, "adoption-ui-receipt.json"),
      JSON.stringify({ commit, original, current }, null, 2) + "\n",
    );
  },
);
