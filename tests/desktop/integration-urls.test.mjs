import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { returnToVaults } from "./workspace-navigation.mjs";

const executable = resolve(
  "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
);
const editor =
  '[data-ui-component="editor"] .cm-content[contenteditable="true"]';
function acknowledgements(root) {
  try {
    return readFileSync(join(root, "integration-actions.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse)
      .filter((entry) => entry.kind === "url-ack");
  } catch {
    return [];
  }
}
async function visibleText(browser, text) {
  await browser.waitUntil(
    async () => (await browser.$(editor).getText()).includes(text),
    { timeout: 15000 },
  );
}
async function secondLaunch(root, url) {
  const child = spawn(executable, [url], {
    env: {
      ...process.env,
      PATH: "/usr/bin:/bin",
      LAPIS_DESKTOP_ACCEPTANCE_ROOT: root,
      LAPIS_DESKTOP_ACCEPTANCE_STATE: join(root, "window-state.json"),
    },
    stdio: "ignore",
  });
  const timeout = setTimeout(() => child.kill("SIGKILL"), 10000);
  try {
    const result = await new Promise((done, fail) => {
      child.once("error", fail);
      child.once("exit", (code, signal) => done({ code, signal }));
    });
    assert.deepEqual(result, { code: 0, signal: null });
  } finally {
    clearTimeout(timeout);
  }
}

test("cold and already-running application URLs share one native owner and preserve pending note saves", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-urls-"),
  );
  const vault = join(root, "URL vault");
  mkdirSync(vault);
  writeFileSync(join(vault, "First.md"), "# First\n");
  writeFileSync(join(vault, "Second.md"), "# Second\n");
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const initial = await nativeSession("integration-url-initial", root);
  context.after(initial.cleanup);
  await initial.browser.$("button*=Open Vault").click();
  await initial.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await initial.browser.$('[data-path="First.md"]').click();
  await visibleText(initial.browser, "# First");
  await initial.close();
  const cold = await nativeSession("integration-url-cold", root, executable, [
    "lapis://open?file=Second",
  ]);
  context.after(cold.cleanup);
  await cold.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await visibleText(cold.browser, "# Second");
  const before = await cold.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  await cold.browser.$(editor).click();
  await cold.browser.keys([Key.Command, "a"]);
  await cold.browser.keys(Key.NULL);
  await cold.browser.$(editor).addValue("# Second\n\nPending URL edit\n");
  await secondLaunch(root, "lapis-notes://open?file=First");
  await visibleText(cold.browser, "# First");
  await cold.browser.waitUntil(() =>
    readFileSync(join(vault, "Second.md"), "utf8").includes("Pending URL edit"),
  );
  const after = await cold.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  assert.equal(after.processId, before.processId);
  execFileSync("/usr/bin/open", [
    "-a",
    resolve("src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app"),
    "web+lapis://open?file=Second",
  ]);
  await visibleText(cold.browser, "Pending URL edit");
  await secondLaunch(root, "lapis://open?file=First");
  await visibleText(cold.browser, "# First");
  await secondLaunch(root, `lapis://${encodeURI(join(vault, "Second.md"))}`);
  await visibleText(cold.browser, "Pending URL edit");
  await cold.browser.$('[data-path="First.md"]').click();
  await visibleText(cold.browser, "# First");
  await secondLaunch(root, "lapis://open?vault=Another%20vault&file=Second");
  await cold.browser.waitUntil(() =>
    cold.browser.execute(() =>
      [
        ...document.querySelectorAll(
          '[data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"]',
        ),
      ].some((toast) =>
        toast.textContent.includes(
          "This link could not be opened in the current vault.",
        ),
      ),
    ),
  );
  await visibleText(cold.browser, "# First");
  await secondLaunch(root, "lapis://open?path=%2Fetc%2Fpasswd");
  await cold.browser.waitUntil(() => acknowledgements(root).length === 7);
  assert.equal(
    new Set(acknowledgements(root).map((entry) => entry.value)).size,
    7,
  );
  await visibleText(cold.browser, "# First");
  await cold.close();
  assert.equal(acknowledgements(root).length, 7);
  const final = await nativeSession("integration-url-restored", root);
  context.after(final.cleanup);
  await final.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await visibleText(final.browser, "# First");
  await final.close();
});

test("launcher and retired vault owners retain queued URLs until the existing chooser returns to a ready vault", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "integration-launcher-"),
  );
  const vault = join(root, "Queued URL vault");
  mkdirSync(vault);
  writeFileSync(join(vault, "First.md"), "# First\n");
  writeFileSync(join(vault, "Second.md"), "# Second\n");
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession(
    "integration-url-launcher",
    root,
    executable,
    ["lapis://open?file=First"],
  );
  context.after(session.cleanup);
  await session.browser.$("button*=Open Vault").waitForDisplayed();
  assert.equal(acknowledgements(root).length, 0);
  const queued = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("desktop_url_next"),
  );
  assert.equal(queued.url, "lapis://open?file=First");
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await visibleText(session.browser, "# First");
  await returnToVaults(session.browser);
  await session.browser
    .$('button[aria-label="Return to previous vault"]')
    .waitForDisplayed();
  await secondLaunch(root, "lapis://open?file=Second");
  const pending = await session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("desktop_url_next"),
  );
  assert.equal(pending.url, "lapis://open?file=Second");
  assert.equal(acknowledgements(root).length, 1);
  await session.browser
    .$('button[aria-label="Return to previous vault"]')
    .click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await visibleText(session.browser, "# Second");
  await session.browser.waitUntil(() => acknowledgements(root).length === 2);
  await session.close();
});
