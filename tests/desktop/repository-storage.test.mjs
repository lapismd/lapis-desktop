import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const storage = 'section[aria-label="History storage"]';
const saved = 'button[aria-label="Vault history: Saved locally"]';
const details = 'section[aria-label="Vault history details"]';
const ready = (browser) =>
  browser.$('[data-notes-ready="true"]').waitForDisplayed({ timeout: 30000 });

async function session(context, name, root) {
  const active = await nativeSession(name, root);
  context.after(async () => {
    try {
      if (active.isRunning()) {
        writeFileSync(
          join(root, `${name}-body.txt`),
          await active.browser.execute(() => document.body.innerText),
        );
        await active.browser.saveScreenshot(join(root, `${name}-screen.png`));
      }
    } finally {
      await active.cleanup();
    }
  });
  return active;
}
async function checkpoint(browser) {
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
  await browser.$(saved).click();
  const copy = browser.$(details).$('button[data-side="commit"]');
  await copy.waitForDisplayed({ timeout: 30000 });
  const id = (await copy.getAttribute("aria-label"))?.match(
    /Copy Git commit SHA ([a-f0-9]{40})$/u,
  )?.[1];
  assert.ok(id);
  await browser.$(saved).click();
  await browser.$(details).waitForDisplayed({ reverse: true });
  return id;
}
async function settings(browser) {
  const controls = await browser.$$('button[aria-label="Open settings"]');
  for (const control of controls) {
    if (await control.isDisplayed()) {
      await control.click();
      break;
    }
  }
  const repository = browser.$("button=Repository History");
  await repository.waitForDisplayed({ timeout: 15000 });
  await repository.click();
  await browser
    .$(storage)
    .$("button=Application data")
    .waitForDisplayed({ timeout: 15000 });
}
async function move(browser, target) {
  const section = browser.$(storage);
  await section.$(`button=${target}`).click();
  const commit = section.$("button=Move history and reload");
  await commit.waitForEnabled();
  await commit.click();
  await browser.$(storage).waitForExist({ reverse: true, timeout: 30000 });
  await ready(browser);
  await browser.$(saved).waitForDisplayed({ timeout: 30000 });
}
async function location(browser) {
  const path = await browser.$(storage).$("code").getText();
  assert.ok(
    existsSync(path),
    "Settings display the actual native-selected repository path",
  );
  return path;
}

test(
  "cold native storage moves preserve vault bytes and retained checkpoints across root and external layouts",
  { timeout: 180000 },
  async (context) => {
    const base = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(base, { recursive: true });
    const root = mkdtempSync(join(base, "storage-ui-"));
    const vault = join(root, "Storage café");
    mkdirSync(join(vault, ".lapis"), { recursive: true });
    writeFileSync(
      join(vault, ".lapis/core-plugins.json"),
      JSON.stringify({ disabled: ["ai"], enabled: [] }),
    );
    const file = join(vault, "Note.md");
    const firstText = "# Before storage move\n\nOriginal retained bytes.\n";
    const latest =
      "# Saved during storage move — café\n\nThe editor stays protected.\n";
    writeFileSync(file, firstText);
    const first = await session(context, "storage-ui", root);
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await first.browser.$("button*=Open Vault").click();
    await ready(first.browser);
    const original = await checkpoint(first.browser);
    await first.browser.$('[data-path="Note.md"]').click();
    const editor = first.browser.$('.cm-content[contenteditable="true"]');
    await editor.waitForDisplayed();
    await editor.click();
    await first.browser.keys([Key.Command, "a"]);
    await first.browser.keys(Key.NULL);
    await editor.addValue(latest);
    await settings(first.browser);
    const externalPath = await location(first.browser);
    assert.equal(externalPath.startsWith(realpathSync(vault) + sep), false);
    await move(first.browser, "Vault root (.jj)");
    assert.ok(existsSync(join(vault, ".jj")));
    assert.equal(readFileSync(file, "utf8"), latest);
    const moved = await checkpoint(first.browser);
    await first.close(true);

    const cold = await session(context, "storage-ui-colocated-reopen", root);
    await ready(cold.browser);
    assert.equal(await checkpoint(cold.browser), moved);
    assert.equal(readFileSync(file, "utf8"), latest);
    await settings(cold.browser);
    assert.equal(
      await cold.browser
        .$(storage)
        .$("button=Vault root (.jj)")
        .getAttribute("data-state"),
      "on",
    );
    await move(cold.browser, "Application data");
    await settings(cold.browser);
    assert.equal(
      await location(cold.browser),
      externalPath,
      "The stable vault identity selects its original external location",
    );
    assert.equal(
      existsSync(join(vault, ".jj")),
      false,
      "Moving out leaves metadata external to the vault",
    );
    assert.equal(readFileSync(file, "utf8"), latest);
    await cold.browser.keys(Key.Escape);
    await cold.browser.$(storage).waitForDisplayed({ reverse: true });
    await cold.browser.$(saved).click();
    await cold.browser.$(details).$("button=Open in JJ Log").click();
    const graph =
      '[aria-label="Repository history"] ol[aria-label="Revision graph"] > li';
    await cold.browser.waitUntil(
      async () =>
        cold.browser.execute(
          (selector, id) =>
            [...document.querySelectorAll(selector)].some((row) =>
              row
                .querySelector(
                  ':scope > .repository-graph-row button[data-side="commit"]',
                )
                ?.getAttribute("aria-label")
                ?.endsWith(id),
            ),
          graph,
          original,
        ),
      { timeout: 30000 },
    );
    await cold.close(true);

    const reopened = await session(context, "storage-ui-external-reopen", root);
    await ready(reopened.browser);
    assert.equal(readFileSync(file, "utf8"), latest);
    await settings(reopened.browser);
    assert.equal(await location(reopened.browser), externalPath);
    assert.equal(
      await reopened.browser
        .$(storage)
        .$("button=Application data")
        .getAttribute("data-state"),
      "on",
    );
    await reopened.close();
    writeFileSync(
      join(root, "storage-ui-receipt.json"),
      JSON.stringify({ original, moved, externalPath, file: latest }, null, 2) +
        "\n",
    );
  },
);
