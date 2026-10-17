import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function fixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Startup vault");
  mkdirSync(vault);
  writeFileSync(join(vault, "Welcome.md"), "# Loading progress\n");
  const session = await nativeSession(
    name,
    root,
    process.env.LAPIS_STARTUP_ACCEPTANCE_EXECUTABLE,
  );
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  return { session, vault };
}

test("cold shell mounts shared centered progress before importing the application", async (context) => {
  const { session } = await fixture(context, "shell-first-progress");
  const initial = await session.browser.execute(
    () => globalThis.__lapisShellStartupAcceptance,
  );
  assert.equal(initial.progress, true);
  assert.equal(initial.message, "Load the desktop shell");
  assert.equal(initial.standaloneLogos, 0);
  assert.equal(initial.appChildren, 0);
  assert.ok(
    initial.logoTop > 52,
    "The initial branded progress stays below native controls",
  );
  assert.ok(Math.abs(initial.logoCenter - initial.windowCenter) < 1);
  await session.close();
});

test("real Notes startup reports phases, plugin detail and accessible progress before the top-edge workspace", async (context) => {
  const { session } = await fixture(context, "startup-progress");
  const { browser } = session;
  await browser.execute(() => {
    window.__startupSamples = [];
    const capture = () => {
      const root = document.querySelector(
        '[data-ui-component="workspace-startup"]',
      );
      if (!root) return;
      window.__startupSamples.push({
        message: root.querySelector('[data-ui-part="message"]')?.textContent,
        progress: root
          .querySelector('[role="progressbar"]')
          ?.getAttribute("aria-valuenow"),
        progressLabel: root
          .querySelector('[role="progressbar"]')
          ?.getAttribute("aria-label"),
        logo: !!root.querySelector(
          '[data-ui-component="desktop-workspace-startup"][data-ui-part="logo"]',
        ),
        tasks: [...root.querySelectorAll('[data-ui-part="task"]')].map(
          (task) => ({
            label:
              task.querySelector('[data-ui-part="task-label"]')?.textContent ??
              task.textContent,
            status: task.getAttribute("data-status"),
          }),
        ),
      });
    };
    window.__startupObserver = new MutationObserver(capture);
    window.__startupObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  });
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const samples = await browser.execute(() => {
    window.__startupObserver.disconnect();
    return window.__startupSamples;
  });
  assert.ok(
    samples.length > 0,
    "Startup must render the public progress surface",
  );
  for (const label of [
    "Open notes storage",
    "Open the vault",
    "Load app configuration",
    "Load configured core plugins",
    "Restore the workspace layout",
    "Load note metadata",
  ]) {
    assert.ok(
      samples.some((sample) =>
        sample.tasks.some(
          (task) => task.status === "active" && task.label.includes(label),
        ),
      ),
      `Actual startup must report ${label}`,
    );
  }
  assert.ok(samples.some((sample) => sample.message.includes("Loading ")));
  assert.ok(
    samples.every(
      (sample) =>
        sample.logo &&
        sample.progressLabel === "Startup progress" &&
        sample.progress !== null,
    ),
  );
  assert.ok(
    samples.some(
      (sample) =>
        sample.tasks.filter((task) => task.status === "complete").length === 4,
    ),
  );
  assert.equal(
    await browser.$('[data-ui-component="workspace-startup"]').isExisting(),
    false,
  );
  assert.equal(
    await browser.execute(
      () =>
        document
          .querySelector(".notes-session-workspace")
          .getBoundingClientRect().top,
    ),
    0,
  );
  await session.close();
});

test("failed native startup keeps its failed step and recovery action visible", async (context) => {
  const { session, vault } = await fixture(context, "startup-failure");
  context.after(() => chmodSync(vault, 0o700));
  chmodSync(vault, 0o500);
  const { browser } = session;
  await browser.$("button*=Open Vault").click();
  const failure = browser.$(
    '[data-ui-component="workspace-startup"][data-state="failed"]',
  );
  await failure.waitForDisplayed();
  assert.equal(await failure.$('[role="alert"]').isDisplayed(), true);
  assert.equal(
    await failure.$('[data-ui-part="failure-summary"]').isDisplayed(),
    true,
  );
  assert.equal(
    await browser.$('[data-notes-ready="true"]').isExisting(),
    false,
  );
  chmodSync(vault, 0o700);
  await browser.$("button=Back to vaults").click();
  await browser.$("button*=Open Vault").waitForDisplayed();
  await session.close();
});
