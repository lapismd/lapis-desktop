import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { seedVerifiedPortablePlugins } from "./portable-fixtures.mjs";

function fixture(name, plugins) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, name + "-"),
  );
  const vault = join(root, "Database plugins");
  mkdirSync(vault);
  seedVerifiedPortablePlugins(vault, plugins);
  return { root, vault };
}
async function choose(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
}
async function open(browser, path) {
  await browser.execute(
    (path) => globalThis.__lapisPluginAcceptance.open(path),
    path,
  );
}
async function run(browser, id) {
  await browser.execute((id) => globalThis.__lapisPluginAcceptance.run(id), id);
}
async function ready(session) {
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
}

test("portable Bases queries native metadata, preserves document bytes and refreshes frontmatter edits across restart", async (context) => {
  const { root, vault } = fixture("portable-bases", ["bases"]);
  const aurora = join(vault, "Aurora.md");
  writeFileSync(aurora, "---\nowner: Maya Chen\nscore: 94\n---\n# Aurora\n");
  writeFileSync(
    join(vault, "Harbor.md"),
    "---\nowner: Leo Martins\nscore: 82\n---\n# Harbor\n",
  );
  const document = JSON.stringify({
    filters: { and: [] },
    properties: {
      "file.name": { displayName: "Project" },
      "note.owner": { displayName: "Owner" },
      "note.score": { displayName: "Score" },
    },
    formulas: {},
    summaries: {},
    activeView: "Projects",
    views: [
      {
        type: "table",
        name: "Projects",
        order: ["file.name", "note.owner", "note.score"],
        sort: [{ property: "note.score", direction: "DESC" }],
        filter: { and: [] },
        limit: 0,
        columnSize: {},
      },
    ],
  });
  writeFileSync(join(vault, "Projects.base"), document);
  const session = await nativeSession("portable-bases", root);
  context.after(session.cleanup);
  const { browser } = session;
  await choose(session, root, vault);
  await open(browser, "Projects.base");
  const table = browser.$('[data-ui-component="bases-table-view"]');
  await table.waitForDisplayed();
  await browser.waitUntil(
    async () => (await table.$$('[data-ui-part="row"]')).length === 2,
    { timeout: 20000 },
  );
  const owner = table.$('[role="combobox"][aria-label="owner"]');
  await owner.waitForDisplayed();
  await owner.setValue("Priya Shah");
  await browser.keys(Key.Enter);
  await browser.waitUntil(
    () => readFileSync(aurora, "utf8").includes("owner: Priya Shah"),
    { timeout: 10000 },
  );
  assert.match(readFileSync(aurora, "utf8"), /score: 94/);
  writeFileSync(
    aurora,
    "---\nowner: External owner\nscore: 94\n---\n# Aurora\n",
  );
  await browser.waitUntil(
    async () => (await owner.getValue()) === "External owner",
    { timeout: 10000 },
  );
  assert.equal(readFileSync(join(vault, "Projects.base"), "utf8"), document);
  await session.close();
  const restored = await nativeSession("portable-bases-restored", root);
  context.after(restored.cleanup);
  await ready(restored);
  const restoredTable = restored.browser.$(
    '[data-ui-component="bases-table-view"]',
  );
  await restoredTable.waitForDisplayed();
  await restored.browser.waitUntil(
    async () =>
      (await restoredTable
        .$('[role="combobox"][aria-label="owner"]')
        .getValue()) === "External owner",
    { timeout: 20000 },
  );
  assert.equal(readFileSync(join(vault, "Projects.base"), "utf8"), document);
  await restored.close();
});

test("portable History captures native edits and external changes, restores database revisions and writes the selected revision", async (context) => {
  const { root, vault } = fixture("portable-history", ["history"]);
  writeFileSync(
    join(vault, ".lapis/plugins/history/data.json"),
    JSON.stringify({ debounceMs: 20, mergeWindowMs: 0 }),
  );
  const file = join(vault, "History.md");
  const initial = "# Native first snapshot\n";
  writeFileSync(file, initial);
  const session = await nativeSession("portable-history", root);
  context.after(session.cleanup);
  const { browser } = session;
  await choose(session, root, vault);
  await open(browser, "History.md");
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
  await run(browser, "history:open-file-history");
  const panel = browser.$('[data-testid="history-panel"]');
  await panel.waitForDisplayed();
  const revisions = () => panel.$$("[data-revision-id]");
  await browser.waitUntil(async () => (await revisions()).length > 0, {
    timeout: 10000,
  });
  const baseline = await panel
    .$("[data-revision-id]")
    .getAttribute("data-revision-id");
  const editor = browser.$(
    '[data-ui-component="editor"] .cm-content[contenteditable="true"]',
  );
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue("# Native second snapshot\n");
  await browser.waitUntil(
    () => readFileSync(file, "utf8") === "# Native second snapshot\n",
    { timeout: 10000 },
  );
  await browser.waitUntil(async () => (await revisions()).length >= 2, {
    timeout: 10000,
  });
  writeFileSync(file, "# Native external snapshot\n");
  await browser.waitUntil(async () => (await revisions()).length >= 3, {
    timeout: 10000,
  });
  await session.close();
  const restored = await nativeSession("portable-history-restored", root);
  context.after(restored.cleanup);
  await ready(restored);
  await run(restored.browser, "history:open-file-history");
  // Layout restoration may replace a projected panel. The embedded driver
  // retains detached element IDs, so resolve the live locator on each poll.
  const restoredPanel = () =>
    restored.browser.$('[data-testid="history-panel"]');
  await restored.browser.waitUntil(
    async () => (await restoredPanel()).isDisplayed(),
    {
      timeout: 10000,
    },
  );
  await restored.browser.waitUntil(
    async () => (await restoredPanel().$$("[data-revision-id]")).length >= 3,
    { timeout: 10000 },
  );
  await restoredPanel().$(`[data-revision-id="${baseline}"]`).click();
  // Selecting a revision opens its comparison and reprojects the sidebar.
  // Wait for that real comparison before clicking its Restore action.
  await restored.browser.waitUntil(
    async () => {
      const comparison = restored.browser.$(
        '[data-testid="history-compare-panel"]',
      );
      return (
        (await comparison.isDisplayed()) &&
        (await comparison.getText()).includes("# Native first snapshot")
      );
    },
    { timeout: 10000 },
  );
  await restored.browser
    .$('[data-testid="history-compare-panel"]')
    .$('button[aria-label="Restore this revision"]')
    .click();
  await restored.browser.waitUntil(
    () => readFileSync(file, "utf8") === initial,
    { timeout: 10000 },
  );
  await restored.close();
});
