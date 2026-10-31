import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  renameSync,
  rmSync,
  copyFileSync,
  chmodSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { focusNativeWindow } from "./native-visibility.mjs";
import {
  acceptConflictSide,
  conflictReview,
  nativeFailure,
  openConflictReview,
  reviewedText,
  saveConflictResult,
} from "./conflict-review.mjs";

const graph = '[data-ui-component="graph"][data-ui-part="global-view"]';
const local = '[data-ui-component="graph"][data-ui-part="local-view"]';
const pluginId = "lapis-graph";
async function observeCanvas(browser) {
  await browser.execute(() => {
    const frames = new WeakMap();
    globalThis.__nativeGraphFrames = {};
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect,
      arc = prototype.arc,
      text = prototype.fillText;
    prototype.clearRect = function (...args) {
      const mode = this.canvas.closest('[data-ui-component="graph"]')?.dataset
        .uiPart;
      if (mode) {
        const frame = { circles: [], labels: [] };
        frames.set(this, frame);
        globalThis.__nativeGraphFrames[mode] = frame;
      }
      return clear.apply(this, args);
    };
    prototype.arc = function (x, y, ...args) {
      const frame = frames.get(this);
      if (frame) {
        const t = this.getTransform();
        const ratio = this.canvas.width / this.canvas.clientWidth;
        frame.circles.push({
          x: (t.a * x + t.c * y + t.e) / ratio,
          y: (t.b * x + t.d * y + t.f) / ratio,
        });
      }
      return arc.call(this, x, y, ...args);
    };
    prototype.fillText = function (label, x, y, ...args) {
      const frame = frames.get(this);
      if (frame) {
        const circle = frame.circles
          .filter((point) => Math.abs(point.x - x) < 0.1 && point.y < y)
          .sort((a, b) => b.y - a.y)[0];
        if (circle) frame.labels.push({ label, ...circle });
      }
      return text.call(this, label, x, y, ...args);
    };
  });
}
async function graphPoints(browser, mode) {
  return browser.execute((mode) => {
    const points = globalThis.__nativeGraphFrames?.[mode]?.circles ?? [];
    return points.filter(
      (point, index) =>
        points.findIndex(
          (other) => Math.hypot(point.x - other.x, point.y - other.y) < 1,
        ) === index,
    );
  }, mode);
}
async function hoverNodes(browser, mode = "global-view") {
  await focusNativeWindow(browser);
  const nodes = [];
  let previous = [],
    stable = 0;
  await browser.waitUntil(
    async () => {
      const current = await graphPoints(browser, mode);
      stable =
        current.length > 0 &&
        current.length === previous.length &&
        current.every(
          (point, index) =>
            Math.hypot(
              point.x - previous[index].x,
              point.y - previous[index].y,
            ) < 0.5,
        )
          ? stable + 1
          : 0;
      previous = current;
      return stable >= 3;
    },
    { timeout: 15000, interval: 100 },
  );
  for (let index = 0; index < previous.length; index++) {
    await browser.waitUntil(async () => {
      const matches = await browser.executeAsync(
        (mode, index, done) => {
          const frame = globalThis.__nativeGraphFrames?.[mode];
          const points = (frame?.circles ?? []).filter(
            (point, index, all) =>
              all.findIndex(
                (other) => Math.hypot(point.x - other.x, point.y - other.y) < 1,
              ) === index,
          );
          const point = points[index];
          if (!point) return done([]);
          const wrapper = document.querySelector(
            `[data-ui-component="graph"][data-ui-part="${mode}"] [data-ui-component="graph-canvas"]`,
          );
          const rect = wrapper.querySelector("canvas").getBoundingClientRect();
          wrapper.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              pointerId: 1,
              pointerType: "mouse",
              isPrimary: true,
              clientX: rect.left + point.x,
              clientY: rect.top + point.y,
            }),
          );
          requestAnimationFrame(() =>
            done(
              (globalThis.__nativeGraphFrames?.[mode]?.labels ?? []).filter(
                (node) => Math.hypot(node.x - point.x, node.y - point.y) < 8,
              ),
            ),
          );
        },
        mode,
        index,
      );
      if (!matches.length) return false;
      nodes.push(...matches);
      return true;
    });
  }
  await browser.execute((mode) => {
    document
      .querySelector(
        `[data-ui-component="graph"][data-ui-part="${mode}"] [data-ui-component="graph-canvas"]`,
      )
      .dispatchEvent(
        new PointerEvent("pointerleave", {
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
        }),
      );
  }, mode);
  return nodes;
}
async function openNodeMenuAction(browser, label) {
  const node = (await hoverNodes(browser)).find((node) => node.label === label);
  assert.ok(node, `The actual canvas must render ${label}`);
  const point = await browser.execute((node) => {
    const rect = document
      .querySelector(
        '[data-ui-component="graph"][data-ui-part="global-view"] canvas',
      )
      .getBoundingClientRect();
    return {
      x: Math.round(rect.left + node.x),
      y: Math.round(rect.top + node.y),
    };
  }, node);
  await browser.execute((point) => {
    document
      .querySelector(
        '[data-ui-component="graph"][data-ui-part="global-view"] [data-ui-component="graph-canvas"]',
      )
      .dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: point.x,
          clientY: point.y,
        }),
      );
  }, point);
  const action = browser.$(
    label.startsWith("#")
      ? '[role="menuitem"]*=Search for tag'
      : '[role="menuitem"]=Open',
  );
  await action.waitForDisplayed();
  await action.click();
}
async function settings(browser, host = graph) {
  await browser.$(`${host} button[aria-label="Toggle graph settings"]`).click();
  await browser.$(host).$("button*=Filters").click();
  await browser.$(`${host} [aria-label="Show tags"]`).waitForDisplayed();
}
async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Native Graph vault");
  mkdirSync(vault);
  mkdirSync(join(vault, ".lapis"));
  writeFileSync(
    join(vault, ".lapis/hotkeys.json"),
    JSON.stringify({
      "lapis-graph:open-graph-view": [{ key: "F7", modifiers: [] }],
      "lapis-graph:open-local-graph": [{ key: "F8", modifiers: [] }],
    }),
  );
  writeFileSync(
    join(vault, ".lapis/app.json"),
    JSON.stringify({
      pluginData: {
        [pluginId]: { settingsVersion: 2, display: { textFadeThreshold: 0.4 } },
      },
    }),
  );
  writeFileSync(
    join(vault, "Alfa.md"),
    "# Alfa\n\n[[Beta]]\n[[Missing]]\n![[image.png]]\n#orchard\n",
  );
  writeFileSync(join(vault, "Beta.md"), "# Beta\n");
  writeFileSync(join(vault, "Gamma.md"), "# Gamma\n");
  copyFileSync("src-tauri/icons/icon.png", join(vault, "image.png"));
  const session = await nativeSession(name, root);
  context.after(async () => {
    try {
      if (session.isRunning())
        writeFileSync(
          join(root, "graph-state.json"),
          JSON.stringify(
            await session.browser.execute(() => ({
              text: document.body.innerText,
              frames: globalThis.__nativeGraphFrames,
              focused: document.hasFocus(),
            })),
            null,
            2,
          ),
        );
    } finally {
      await session.cleanup();
    }
  });
  const { browser } = session;
  await observeCanvas(browser);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await browser.$('[data-path="Alfa.md"]').click();
  await browser
    .$('[data-ui-component="editor"] .cm-content[contenteditable="true"]')
    .waitForDisplayed();
  await browser.waitUntil(async () =>
    (
      await browser
        .$('[data-ui-component="editor"] .cm-content[contenteditable="true"]')
        .getText()
    ).includes("# Alfa"),
  );
  await browser.keys(Key.F7);
  await browser.$(graph).waitForDisplayed();
  await browser.waitUntil(
    async () =>
      (await browser.$(`${graph} [data-ui-part="stats"]`).getText()).includes(
        "3 nodes • 1 links",
      ),
    { timeout: 15000 },
  );
  return {
    root,
    vault,
    path: join(vault, ".lapis/app.json"),
    session,
    browser,
  };
}

test("native global/local Graph renders indexed semantics, follows files, navigates and restores", async (context) => {
  const { root, vault, session, browser } = await fixture(
    context,
    "graph-indexed",
  );
  assert.ok((await hoverNodes(browser)).some((node) => node.label === "Gamma"));
  await settings(browser);
  await browser.$(`${graph} [aria-label="Show tags"]`).click();
  await browser.$(`${graph} [aria-label="Show attachments"]`).click();
  await browser.$(`${graph} [aria-label="Existing files only"]`).click();
  await browser.waitUntil(async () =>
    (await browser.$(`${graph} [data-ui-part="stats"]`).getText()).includes(
      "6 nodes • 4 links",
    ),
  );
  await browser.$(`${graph} [aria-label="Close settings"]`).click();
  const filteredLabels = (await hoverNodes(browser)).map((node) => node.label);
  assert.ok(filteredLabels.includes("Missing"));
  assert.ok(filteredLabels.includes("image.png"));
  await browser.$('[data-path="Alfa.md"]').click();
  await browser.keys(Key.F8);
  await browser.$(local).waitForDisplayed();
  await browser.execute(
    (element) => {
      for (let index = 0; index < 3; index += 1)
        element.dispatchEvent(
          new KeyboardEvent("keydown", { key: "-", bubbles: true }),
        );
    },
    await browser.$(`${local} [data-ui-component="graph-canvas"]`),
  );
  const localLabels = (await hoverNodes(browser, "local-view")).map(
    (node) => node.label,
  );
  assert.ok(localLabels.includes("Alfa"));
  assert.ok(localLabels.includes("Beta"));
  assert.equal(localLabels.includes("Gamma"), false);
  await browser.$('[data-path="Gamma.md"]').click();
  await browser.waitUntil(
    async () => (await graphPoints(browser, "local-view")).length === 1,
  );
  assert.deepEqual(
    (await hoverNodes(browser, "local-view")).map((node) => node.label),
    ["Gamma"],
  );
  await browser.$('[data-path="Alfa.md"]').click();
  await browser.waitUntil(async () =>
    (
      await browser
        .$('[data-ui-component="editor"] .cm-content[contenteditable="true"]')
        .getText()
    ).includes("# Alfa"),
  );
  await browser.keys(Key.F7);
  await browser.$(graph).waitForDisplayed();
  writeFileSync(join(vault, "Delta.md"), "# Delta\n\n[[Alfa]]\n");
  await browser.waitUntil(async () =>
    (await browser.$(`${graph} [data-ui-part="stats"]`).getText()).includes(
      "7 nodes • 5 links",
    ),
  );
  assert.ok((await hoverNodes(browser)).some((node) => node.label === "Delta"));
  renameSync(join(vault, "Delta.md"), join(vault, "Renamed.md"));
  await browser.$('[data-path="Renamed.md"]').waitForDisplayed();
  const renamedLabels = (await hoverNodes(browser)).map((node) => node.label);
  assert.ok(renamedLabels.includes("Renamed"));
  assert.equal(renamedLabels.includes("Delta"), false);
  rmSync(join(vault, "Renamed.md"));
  await browser.waitUntil(async () =>
    (await browser.$(`${graph} [data-ui-part="stats"]`).getText()).includes(
      "6 nodes • 4 links",
    ),
  );
  assert.equal(
    (await hoverNodes(browser)).some((node) => node.label === "Renamed"),
    false,
  );
  await openNodeMenuAction(browser, "Beta");
  await browser.waitUntil(async () =>
    (
      await browser
        .$('[data-ui-component="editor"] .cm-content[contenteditable="true"]')
        .getText()
    ).includes("# Beta"),
  );
  await browser.keys(Key.F7);
  await browser.$(graph).waitForDisplayed();
  await openNodeMenuAction(browser, "#orchard");
  await browser.$('[data-ui-component="search-panel"]').waitForDisplayed();
  assert.equal(
    await browser.$('[data-ui-component="search-panel"] .cm-content').getText(),
    "tag:#orchard",
  );
  await session.close();
  const restored = await nativeSession("graph-indexed-restored", root);
  context.after(restored.cleanup);
  await observeCanvas(restored.browser);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$(local).waitForDisplayed();
  await restored.browser.keys(Key.F7);
  await restored.browser.$(graph).waitForDisplayed();
  await restored.browser.$(`${graph} [aria-label="Reset view"]`).click();
  const restoredLabels = (await hoverNodes(restored.browser)).map(
    (node) => node.label,
  );
  assert.ok(restoredLabels.includes("Beta"));
  assert.equal(restoredLabels.includes("Renamed"), false);
  await restored.close();
});

test("Graph controls enter close admission before debounce and survive cold restart", async (context) => {
  const { root, path, session, browser } = await fixture(
    context,
    "graph-close",
  );
  await settings(browser);
  await browser.$(`${graph} [aria-label="Show tags"]`).click();
  await session.close();
  assert.equal(
    JSON.parse(readFileSync(path, "utf8")).pluginData[pluginId].filters
      .showTags,
    true,
  );
  const restored = await nativeSession("graph-close-restored", root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await restored.browser.$(graph).waitForDisplayed();
  await settings(restored.browser);
  assert.equal(
    await restored.browser
      .$(`${graph} [aria-label="Show tags"]`)
      .getAttribute("aria-checked"),
    "true",
  );
  await restored.close();
});

test("Graph failed writes block Close and disk recovery refreshes controls before another partial write", async (context) => {
  const { vault, path, session, browser } = await fixture(
    context,
    "graph-recovery",
  );
  await settings(browser);
  // Isolate the Graph write fault from the debounced layout save after F7.
  const layout = join(vault, ".lapis/workspace.json");
  await browser.waitUntil(
    () =>
      existsSync(layout) &&
      JSON.stringify(JSON.parse(readFileSync(layout, "utf8"))).includes(
        '"type":"graph"',
      ),
  );
  const external = JSON.parse(readFileSync(path, "utf8"));
  const directory = join(vault, ".lapis");
  context.after(() => chmodSync(directory, 0o700));
  chmodSync(directory, 0o500);
  await browser.$(`${graph} [aria-label="Show tags"]`).click();
  await openConflictReview(browser, ".lapis/app.json");
  external.pluginData[pluginId].filters = {
    showTags: false,
    showAttachments: true,
  };
  external.outside = "retained";
  const bytes = JSON.stringify(external, null, 2);
  writeFileSync(path, bytes);
  await session.requestClose();
  await browser.$(nativeFailure).waitForDisplayed();
  assert.equal(session.isRunning(), true);
  chmodSync(directory, 0o700);
  await browser.$("button=Check disk again").click();
  await reviewedText(
    browser,
    ".lapis/app.json",
    "Disk version",
    '"showAttachments": true',
  );
  assert.equal(readFileSync(path, "utf8"), bytes);
  await acceptConflictSide(browser, ".lapis/app.json", "Right");
  await saveConflictResult(browser, ".lapis/app.json");
  await browser.waitUntil(() => readFileSync(path, "utf8") === bytes);
  await browser
    .$(conflictReview(".lapis/app.json"))
    .waitForExist({ reverse: true });
  assert.equal(
    await browser
      .$(`${graph} [aria-label="Show tags"]`)
      .getAttribute("aria-checked"),
    "false",
  );
  assert.equal(
    await browser
      .$(`${graph} [aria-label="Show attachments"]`)
      .getAttribute("aria-checked"),
    "true",
  );
  await browser.$(`${graph} [aria-label="Existing files only"]`).click();
  await session.close();
  const saved = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(saved.pluginData[pluginId].filters.showTags, false);
  assert.equal(saved.pluginData[pluginId].filters.showAttachments, true);
  assert.equal(saved.pluginData[pluginId].filters.existingFilesOnly, false);
  assert.equal(saved.outside, "retained");
});
