import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";

async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Recovery café");
  mkdirSync(join(vault, ".lapis"), { recursive: true });
  writeFileSync(join(vault, "Note.md"), "# Recovery note\n");
  const layout = join(vault, ".lapis/workspace.json");
  writeFileSync(layout, "not a layout");
  const core = join(vault, ".lapis/core-plugins.json");
  writeFileSync(core, "[]");
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  const { browser } = session;
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await browser.$("button*=Open Vault").click();
  await browser
    .$(
      '[data-ui-component="workspace-startup"][data-state="failed"] [role="alert"]',
    )
    .waitForDisplayed();
  const configuration = join(vault, ".lapis/app.json");
  const configBytes = () =>
    existsSync(configuration) ? readFileSync(configuration, "utf8") : null;
  return { root, vault, core, layout, session, browser, configBytes };
}

test("startup retry uses a fresh owner after external layout repair and retains full diagnostics", async (context) => {
  const { layout, core, session, browser } = await fixture(
    context,
    "retry-layout",
  );
  await browser.$("button=Copy error details").waitForDisplayed();
  const details = await browser
    .$('[data-ui-component="workspace-startup"]')
    .getText();
  assert.match(details, /Restore the workspace layout/);
  await browser.$('[data-ui-part="failure-detail"] summary').click();
  const diagnostic = await browser
    .$('[data-ui-part="failure-detail"] pre')
    .getText();
  assert.match(diagnostic, /JSON|parse|layout/iu);
  assert.match(diagnostic, /@|\bat /u);
  writeFileSync(layout, "{}");
  await browser.$("button=Retry").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  assert.equal(await browser.$('[aria-label="Safe Mode"]').isExisting(), false);
  assert.equal(readFileSync(core, "utf8"), "[]");
  assert.equal(
    (
      await browser.$$(
        '[data-ui-component="lapis-workspace-shell"][data-ui-part="root"]',
      )
    ).length,
    1,
  );
  await session.close();
});

test("session Safe Mode preserves configuration across guarded reload and explicit layout reset restores normal startup", async (context) => {
  const { layout, core, session, browser, configBytes } = await fixture(
    context,
    "safe-layout",
  );
  const configurationBefore = configBytes();
  await browser.execute(() => {
    document
      .querySelector(
        '[data-ui-component="workspace-startup"][data-state="failed"]',
      )
      ?.setAttribute("data-native-recovery-before", "true");
  });
  await browser.$("button=Start with optional plugins disabled").click();
  await browser.waitUntil(async () =>
    browser.execute(() => {
      const current = document.querySelector(
        '[data-ui-component="workspace-startup"][data-state="failed"]',
      );
      return (
        current !== null && !current.hasAttribute("data-native-recovery-before")
      );
    }),
  );
  await browser
    .$(
      '[data-ui-component="workspace-startup"][data-state="failed"] [role="alert"]',
    )
    .waitForDisplayed();
  await browser.$("button=Start without restoring layout").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  let banner = browser.$('[aria-label="Safe Mode"]');
  await banner.waitForDisplayed();
  assert.match(await banner.getText(), /non-required core plugins disabled/);
  assert.match(await banner.getText(), /saved layout restore skipped/);
  assert.equal(readFileSync(layout, "utf8"), "not a layout");
  assert.equal(configBytes(), configurationBefore);
  assert.equal(readFileSync(core, "utf8"), "[]");
  await browser.$("button=Rebuild metadata").click();
  try {
    await browser.waitUntil(async () =>
      (await browser.$('[aria-label="Safe Mode"]').getText()).includes(
        "Metadata rebuilt",
      ),
    );
  } catch (error) {
    throw new Error(`${error.message}\n${await browser.$("body").getText()}`, {
      cause: error,
    });
  }
  await browser.$("button=Rebuild Search").click();
  await browser.waitUntil(async () =>
    (await browser.$('[aria-label="Safe Mode"]').getText()).includes(
      "Search index rebuilt",
    ),
  );
  await browser.execute(() => {
    window.__recoveryBeforeReload = true;
  });
  await browser.keys([Key.Command, "r"]);
  await browser.keys(Key.NULL);
  await browser.waitUntil(async () => {
    try {
      return await browser.execute(
        () => window.__recoveryBeforeReload !== true,
      );
    } catch {
      return false;
    }
  });
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  banner = browser.$('[aria-label="Safe Mode"]');
  await banner.waitForDisplayed();
  assert.equal(readFileSync(layout, "utf8"), "not a layout");
  assert.equal(configBytes(), configurationBefore);
  await browser.$("button=Restart normally").click();
  await browser
    .$(
      '[data-ui-component="workspace-startup"][data-state="failed"] [role="alert"]',
    )
    .waitForDisplayed();
  await browser.$("button=Reset saved layout").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  assert.equal(await browser.$('[aria-label="Safe Mode"]').isExisting(), false);
  assert.equal(readFileSync(core, "utf8"), "[]");
  assert.doesNotThrow(() => JSON.parse(readFileSync(layout, "utf8")));
  await session.close();
});
