import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";
import { seedVerifiedPortablePlugins } from "./portable-fixtures.mjs";

function fixture(name, plugins) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, name + "-"),
  );
  const vault = join(root, "Portable notes");
  mkdirSync(vault);
  seedVerifiedPortablePlugins(vault, plugins);
  writeFileSync(join(vault, "Note.md"), "Alpha beta gamma\n");
  return { root, vault };
}
async function choose(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
}
async function state(browser, id) {
  return browser.execute(
    (id) => globalThis.__lapisPluginAcceptance.state(id),
    id,
  );
}
async function command(browser, id) {
  await browser.execute((id) => globalThis.__lapisPluginAcceptance.run(id), id);
}
async function text(browser, expected) {
  await browser.waitUntil(
    () =>
      browser.execute(
        (expected) => document.body.textContent.includes(expected),
        expected,
      ),
    { timeout: 10000, timeoutMsg: `Native plugin text: ${expected}` },
  );
}
async function slideArrow(browser, key, keyCode) {
  await browser.execute(() => {
    const deck = document.querySelector('[data-testid="slides-deck"]');
    // Reveal's embedded focus controller activates on pointerdown; the
    // embedded driver's element.click() does not synthesize that event.
    deck.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pointerType: "mouse",
        isPrimary: true,
      }),
    );
    deck.focus();
    document.addEventListener(
      "keydown",
      (event) => {
        globalThis.__lapisSlideKeyReceipt = {
          key: event.key,
          keyCode: event.keyCode,
        };
      },
      { once: true, capture: true },
    );
  });
  assert.equal(
    await browser
      .$('[data-testid="slides-deck"]')
      .getAttribute("class")
      .then((value) => value.split(" ").includes("focused")),
    true,
  );
  await browser.keys(Key[key]);
  assert.deepEqual(
    await browser.execute(() => globalThis.__lapisSlideKeyReceipt),
    { key, keyCode },
  );
}

async function assertPortable(browser, id) {
  const value = await state(browser, id);
  assert.equal(value.enabled, true, JSON.stringify(value));
  assert.equal(value.diagnostics.selectedRuntimeHost, "tauri-desktop");
}

test("portable Bookmarks and Word Count retain UI writes, native rename freshness and cold state", async (context) => {
  const { root, vault } = fixture("portable-basic", ["bookmarks", "wordcount"]);
  const data = join(vault, ".lapis/plugins/bookmarks/data.json");
  writeFileSync(
    data,
    JSON.stringify({
      items: [
        { type: "file", ctime: 1, path: "Note.md", title: "Kept bookmark" },
      ],
    }),
  );
  const session = await nativeSession("portable-basic", root);
  context.after(session.cleanup);
  const { browser } = session;
  await choose(session, root, vault);
  await assertPortable(browser, "bookmarks");
  await assertPortable(browser, "wordcount");
  await browser.$('[data-path="Note.md"]').click();
  await text(browser, "3 words");
  const editor = browser.$(
    '[data-ui-component="editor"] .cm-content[contenteditable="true"]',
  );
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue("Alpha beta gamma delta epsilon\n");
  await text(browser, "5 words");
  await command(browser, "bookmarks:open-bookmarks");
  await browser
    .$('[role="treeitem"][aria-label="Kept bookmark"]')
    .waitForDisplayed();
  await browser.$('button[aria-label="New group"]').click();
  const input = browser.$('[data-ui-component="bookmarks-panel"] input');
  await input.waitForDisplayed();
  await input.setValue("Retained native group");
  await browser.keys(Key.Enter);
  await browser
    .$('[role="treeitem"][aria-label="Retained native group"]')
    .waitForDisplayed();
  await browser.waitUntil(
    () =>
      readFileSync(join(vault, "Note.md"), "utf8") ===
      "Alpha beta gamma delta epsilon\n",
    {
      timeout: 10000,
      timeoutMsg:
        "The note must acknowledge its save before an external rename",
    },
  );
  // A visible new-file event acknowledges the native snapshot after the
  // editor's atomic inode replacement, before testing an external rename.
  await browser.$("button=Files").click();
  writeFileSync(join(vault, "Baseline ready.md"), "Watch baseline ready\n");
  await browser.$('[data-path="Baseline ready.md"]').waitForExist();
  renameSync(join(vault, "Note.md"), join(vault, "Renamed.md"));
  await browser.waitUntil(
    () =>
      JSON.parse(readFileSync(data, "utf8")).items.some(
        (item) => item.path === "Renamed.md",
      ),
    { timeout: 10000 },
  );
  await session.close();
  assert.equal(
    readFileSync(join(vault, "Renamed.md"), "utf8"),
    "Alpha beta gamma delta epsilon\n",
  );
  const restored = await nativeSession("portable-basic-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await assertPortable(restored.browser, "bookmarks");
  await command(restored.browser, "bookmarks:open-bookmarks");
  await restored.browser
    .$('[role="treeitem"][aria-label="Retained native group"]')
    .waitForDisplayed();
  await restored.browser.execute(() =>
    globalThis.__lapisPluginAcceptance.open("Renamed.md"),
  );
  await text(restored.browser, "5 words");
  await restored.close();
});

test("portable Slides uses the shared Markdown embed and follows native external edits before returning to its source", async (context) => {
  const { root, vault } = fixture("portable-slides", ["lapis-slides"]);
  const file = join(vault, "Note.md");
  writeFileSync(file, "# Opening\n\n---\n\n## Goals\n\n- First goal\n");
  const session = await nativeSession("portable-slides", root);
  context.after(session.cleanup);
  const { browser } = session;
  await choose(session, root, vault);
  await assertPortable(browser, "lapis-slides");
  await browser.$('[data-path="Note.md"]').click();
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
  await command(browser, "lapis-slides:start-presentation");
  const deck = browser.$('[data-testid="slides-deck"]');
  await deck.waitForDisplayed();
  await deck.$("h1=Opening").waitForDisplayed();
  await browser.waitUntil(
    async () => (await deck.getAttribute("class")).split(" ").includes("ready"),
    { timeout: 10000 },
  );
  await browser.execute(() =>
    document.querySelector('[data-testid="slides-deck"]').focus(),
  );
  await slideArrow(browser, "ArrowRight", 39);
  try {
    await deck.$("h2=Goals").waitForDisplayed();
  } catch (error) {
    console.error(
      "Native Slides state",
      await browser.execute(() => ({
        receipt: globalThis.__lapisSlideKeyReceipt,
        active: document.activeElement?.outerHTML?.slice(0, 300),
        sections: [
          ...document.querySelectorAll('[data-testid="slides-deck"] section'),
        ].map((node) => ({
          class: node.className,
          text: node.textContent?.slice(0, 120),
          hidden: node.getAttribute("aria-hidden"),
          display: getComputedStyle(node).display,
        })),
        controls: [
          ...document.querySelectorAll(
            '[data-testid="slides-deck"] .controls button',
          ),
        ].map((node) => ({
          label: node.getAttribute("aria-label"),
          class: node.className,
        })),
      })),
    );
    throw error;
  }
  writeFileSync(
    file,
    "# Updated opening\n\n---\n\n## Goals\n\n- Updated goal\n",
  );
  await text(browser, "Updated opening");
  await slideArrow(browser, "ArrowLeft", 37);
  await deck.$("h1=Updated opening").waitForDisplayed();
  await browser.$('button[aria-label="Close presentation"]').click();
  await browser
    .$('[data-testid="slides-overlay"]')
    .waitForExist({ reverse: true });
  await browser.$('.cm-content[contenteditable="true"]').waitForDisplayed();
  assert.match(readFileSync(file, "utf8"), /Updated opening/);
  await session.close();
});

test("portable plugin disable and vault switching preserve preferences without leaking views or counters", async (context) => {
  const { root, vault } = fixture("portable-isolation", [
    "bookmarks",
    "wordcount",
  ]);
  const other = join(root, "Other vault");
  mkdirSync(other);
  seedVerifiedPortablePlugins(other, []);
  writeFileSync(join(other, "Other.md"), "A separate note\n");
  const session = await nativeSession("portable-isolation", root);
  context.after(session.cleanup);
  const { browser } = session;
  await choose(session, root, vault);
  await browser.$('[data-path="Note.md"]').click();
  await text(browser, "3 words");
  await browser.execute(() =>
    globalThis.__lapisPluginAcceptance.enabled("wordcount", false),
  );
  assert.equal((await state(browser, "wordcount")).enabled, false);
  assert.equal(
    await browser.execute(() => document.body.textContent.includes("3 words")),
    false,
  );
  await returnToVaults(browser);
  await browser.$("[data-desktop-vault-launcher]").waitForDisplayed();
  await choose(session, root, other);
  assert.equal((await state(browser, "bookmarks")).enabled, false);
  assert.equal((await state(browser, "wordcount")).enabled, false);
  await browser.$('[data-path="Other.md"]').click();
  assert.equal(
    await browser.execute(() => document.body.textContent.includes("3 words")),
    false,
  );
  const preferences = JSON.parse(
    readFileSync(join(vault, ".lapis/community-plugins.json"), "utf8"),
  );
  assert.equal(preferences.includes("wordcount"), false);
  await session.close();
});
