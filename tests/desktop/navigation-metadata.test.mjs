import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

const view = (name) => `[data-ui-component="${name}"]`;
const editor =
  '[data-ui-component="editor"] .cm-content[contenteditable="true"]';
async function command(browser, name) {
  await browser.$('button[aria-label="Open command palette"]').click();
  const input = browser.$('[role="dialog"] input');
  await input.waitForDisplayed();
  await input.setValue(name);
  const option = browser.$(`[role="option"]*=${name}`);
  await option.waitForDisplayed();
  await option.click();
}
async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Metadata navigation vault");
  mkdirSync(vault);
  const original =
    "---\nstatus: ready\n---\n# Alfa\n\n## Citrus chapter\n\n#orchard\n\n[[Beta]]\n";
  writeFileSync(join(vault, "Alfa.md"), original);
  writeFileSync(
    join(vault, "Beta.md"),
    "---\nremoved: yes\n---\n# Beta\n\n#beta\n",
  );
  writeFileSync(
    join(vault, "Incoming.md"),
    "# Incoming\n\nA reference to [[Alfa]].\n",
  );
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Alfa.md"]').click();
  await browser.$(editor).waitForDisplayed();
  return { root, vault, original, browser, session };
}
async function searchQuery(browser, expected) {
  const input = browser.$(
    `${view("search-panel")} .cm-content[contenteditable="true"]`,
  );
  await input.waitForDisplayed();
  await browser.waitUntil(async () => (await input.getText()) === expected);
}

test("existing metadata panels navigate, refresh edits and file changes, and restore after a cold restart", async (context) => {
  const { root, vault, original, browser, session } = await fixture(
    context,
    "metadata-panels",
  );
  await command(browser, "Open Outline");
  const heading = browser.$(view("outline")).$("button*=Citrus chapter");
  await heading.waitForDisplayed();
  await heading.click();
  await browser.execute(
    (selector) => document.querySelector(selector).focus(),
    editor,
  );
  await browser.$(editor).addValue("Navigation proof ");
  await browser.waitUntil(() =>
    readFileSync(join(vault, "Alfa.md"), "utf8").includes(
      "Navigation proof ## Citrus chapter",
    ),
  );
  await browser.keys([Key.Command, "z"]);
  await browser.keys(Key.NULL);
  await browser.waitUntil(
    () => readFileSync(join(vault, "Alfa.md"), "utf8") === original,
  );
  await command(browser, "Open Backlinks");
  const group = browser.$(view("backlinks")).$("button*=Incoming");
  await group.waitForDisplayed();
  if ((await group.getAttribute("aria-expanded")) === "false")
    await group.click();
  await browser
    .$(`${view("backlinks")} [aria-label^="Open Incoming:"]`)
    .click();
  await browser.waitUntil(async () =>
    (await browser.$(editor).getText()).includes("# Incoming"),
  );
  await browser.$('[data-path="Alfa.md"]').click();
  await command(browser, "Open Outgoing Links");
  const outgoing = browser.$(view("outgoing-links")).$("button*=Beta");
  await outgoing.waitForDisplayed();
  if ((await outgoing.getAttribute("aria-expanded")) === "false")
    await outgoing.click();
  await browser
    .$(`${view("outgoing-links")} [aria-label^="Open Beta:"]`)
    .click();
  await browser.waitUntil(async () =>
    (await browser.$(editor).getText()).includes("# Beta"),
  );
  await browser.$('[data-path="Alfa.md"]').click();
  const updated = original
    .replace("Citrus chapter", "Tangerine chapter")
    .replace("status: ready", "status: done");
  writeFileSync(join(vault, "Alfa.md"), updated);
  await command(browser, "Open Outline");
  await browser
    .$(view("outline"))
    .$("button*=Tangerine chapter")
    .waitForDisplayed();
  assert.equal(
    await browser.$(view("outline")).$("button*=Citrus chapter").isExisting(),
    false,
  );
  renameSync(join(vault, "Incoming.md"), join(vault, "Renamed.md"));
  await command(browser, "Open Backlinks");
  await browser.$(view("backlinks")).$("button*=Renamed").waitForDisplayed();
  assert.equal(
    await browser.$(view("backlinks")).$("button*=Incoming").isExisting(),
    false,
  );
  rmSync(join(vault, "Beta.md"));
  await command(browser, "Open Tags");
  await browser.$(view("tags")).$("button*=orchard").waitForDisplayed();
  await browser.waitUntil(
    async () => !(await browser.$(view("tags")).$("button*=beta").isExisting()),
  );
  await command(browser, "Open File Properties");
  const status = browser.$(
    '[data-testid="file-properties-panel"] [aria-label="status value"]',
  );
  await status.waitForDisplayed();
  assert.equal(await status.getText(), "done");
  await session.close();
  const restored = await nativeSession("metadata-panels-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser
    .$('[data-testid="file-properties-panel"] [aria-label="status value"]')
    .waitForDisplayed();
  await command(restored.browser, "Open Outline");
  await restored.browser
    .$(view("outline"))
    .$("button*=Tangerine chapter")
    .waitForDisplayed();
  await command(restored.browser, "Open Backlinks");
  await restored.browser
    .$(view("backlinks"))
    .$("button*=Renamed")
    .waitForDisplayed();
  assert.equal(readFileSync(join(vault, "Alfa.md"), "utf8"), updated);
  await restored.close();
});

test("existing Tags and All Properties hand off their exact query to Search", async (context) => {
  const { browser, session } = await fixture(context, "metadata-search");
  await command(browser, "Open Tags");
  const tag = browser.$(view("tags")).$("button*=orchard");
  await tag.waitForDisplayed();
  await tag.click();
  await searchQuery(browser, "tag:#orchard");
  await browser
    .$(
      `${view("search-panel")} [role="treeitem"][aria-level="1"][aria-label*=" · Alfa.md,"]`,
    )
    .waitForDisplayed();
  await command(browser, "Open All Properties");
  const property = browser.$(view("all-properties")).$("button*=status");
  await property.waitForDisplayed();
  await property.click();
  await searchQuery(browser, '["status"]');
  await browser
    .$(
      `${view("search-panel")} [role="treeitem"][aria-level="1"][aria-label*=" · Alfa.md,"]`,
    )
    .waitForDisplayed();
  await session.close();
});

test("metadata Search actions remain recoverable while Search is disabled", async (context) => {
  const { browser, session } = await fixture(
    context,
    "metadata-disabled-search",
  );
  async function toggleSearch() {
    await browser.$('button[aria-label="Open settings"]').click();
    await browser.$("button=Core plugins").click();
    const toggle = browser.$(
      '[data-settings-plugin-id="search"] [role="switch"]',
    );
    await toggle.waitForDisplayed();
    const previous = await toggle.getAttribute("aria-checked");
    await toggle.click();
    await browser.waitUntil(
      async () => (await toggle.getAttribute("aria-checked")) !== previous,
    );
    const close = browser.$('button[aria-label="Close settings"]');
    await close.click();
    await close.waitForExist({ reverse: true });
  }
  await toggleSearch();
  await command(browser, "Open Tags");
  await browser.$(view("tags")).$("button*=orchard").click();
  assert.equal(await browser.$(view("search-panel")).isExisting(), false);
  await command(browser, "Open All Properties");
  await browser.$(view("all-properties")).$("button*=status").click();
  assert.equal(await browser.$(view("search-panel")).isExisting(), false);
  assert.match(await browser.$(editor).getText(), /# Alfa/);
  await toggleSearch();
  await command(browser, "Open Tags");
  await browser.$(view("tags")).$("button*=orchard").click();
  await searchQuery(browser, "tag:#orchard");
  await session.close();
});

test("ordinary Markdown internal links open the intended native workspace note", async (context) => {
  const { vault, browser, session } = await fixture(
    context,
    "metadata-internal-link",
  );
  await browser.$('button[aria-label="Open Alfa.md tab menu"]').click();
  await browser.$("span=Reading view").click();
  const link = browser.$(
    '[data-link-preview-trigger][data-link-preview-path="Beta"][data-link-preview-state="resolved"]',
  );
  await link.waitForDisplayed();
  await link.click();
  await browser
    .$('button[aria-label="Open Beta.md tab menu"]')
    .waitForDisplayed();
  await session.close();
  const layout = JSON.parse(
    readFileSync(join(vault, ".lapis/workspace.json"), "utf8"),
  );
  function activeFile(node) {
    if (node.id === layout.active) return node.state?.state?.file;
    return node.children?.map(activeFile).find(Boolean);
  }
  assert.equal(activeFile(layout.main), "Beta.md");
});
