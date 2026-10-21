import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { focusNativeWindow } from "./native-visibility.mjs";

export async function openAiSettings(browser) {
  if (process.env.LAPIS_AI_TEST_HEADED === "1")
    await focusNativeWindow(browser);
  await browser.$('button[aria-label="Open settings"]').click();
  const navigation = browser.$('[aria-label="Settings navigation"]');
  await navigation.waitForDisplayed();
  // The workspace also has an AI tab. Select the Settings navigation entry.
  await navigation.$("button=AI").click();
  await browser
    .$("button=Prepare runtime")
    .waitForDisplayed({ timeout: 45_000 });
}

// Exercise the actual Settings controls, private native profile and real weights.
export async function prepareLocal(f) {
  const browser = f.session.browser;
  const savedPath = join(f.root, "profile/ai-compute/settings.json");
  const saved = () => JSON.parse(readFileSync(savedPath, "utf8"));
  async function finishMotion() {
    if (process.env.LAPIS_AI_TEST_HEADED === "1") return;
    // Hidden WebViews freeze CSS entrance/exit animations at time zero. This
    // API lane observes settled UI; headed acceptance retains native motion.
    await browser.execute(() => {
      for (const animation of document.getAnimations())
        if (Number.isFinite(animation.effect?.getComputedTiming().endTime))
          animation.finish();
    });
  }
  async function openSettings() {
    await openAiSettings(browser);
  }
  await openSettings();
  const provider = browser.$('button[aria-label^="Provider:"]');
  await provider.waitForEnabled();
  // The hidden native driver does not focus a Bits Select on pointer click.
  await browser.execute(() =>
    document.querySelector('button[aria-label^="Provider:"]').focus(),
  );
  await browser.keys("ArrowDown");
  await browser.$('[role="option"][data-value="local"]').waitForExist();
  await finishMotion();
  await browser
    .$('[role="option"][data-value="local"]')
    .waitForDisplayed({ timeout: 10_000 });
  const options = await browser.$$('[role="option"]');
  writeFileSync(
    join(f.root, "provider-catalog.json"),
    JSON.stringify(await options.map((option) => option.getText()), null, 2),
  );
  const local = browser.$(
    '//*[@role="option" and normalize-space(.)="This machine"]',
  );
  await local.waitForDisplayed();
  await browser.keys("Home");
  await browser.keys("Enter");
  await finishMotion();
  assert.equal(
    await provider.getAttribute("aria-label"),
    "Provider: This machine",
  );
  await browser.$("button=Save provider").click();
  await browser.waitUntil(
    () => {
      const path = join(f.root, "profile/ai-providers/settings.json");
      return (
        existsSync(path) &&
        JSON.parse(readFileSync(path, "utf8")).configuration.provider ===
          "local"
      );
    },
    { timeout: 30_000 },
  );
  assert.equal(existsSync(join(f.root, "profile/ai-compute/compute")), false);
  const region = browser.$(
    '//*[@role="region"][.//*[text()="Optional compute"]]',
  );
  assert.match(await region.getText(), /off/u);
  const model =
    process.env.LAPIS_AI_TEST_MODEL ?? "unsloth/Qwen3-0.6B-GGUF:Q4_K_M";
  await region
    .$('input[placeholder="unsloth/Qwen3-0.6B-GGUF:Q4_K_M"]')
    .setValue(model);
  const commands = [];
  async function command(label, action) {
    const previous = existsSync(savedPath) ? saved().request?.requestId : null;
    const button = region.$(`button=${label}`);
    await button.waitForEnabled({ timeout: 45_000 });
    await button.click();
    let receipt;
    await browser.waitUntil(
      () => {
        if (!existsSync(savedPath)) return false;
        receipt = saved();
        return (
          receipt.request?.action?.type === action &&
          receipt.request.requestId !== previous &&
          receipt.outcome !== "pending"
        );
      },
      {
        timeout: 600_000,
        interval: 500,
        timeoutMsg: `Native compute ${action} did not settle`,
      },
    );
    assert.equal(
      receipt.outcome,
      "completed",
      `Native compute ${action} failed`,
    );
    commands.push({ action, requestId: receipt.request.requestId });
    console.log(`Native local compute ${action}: completed`);
  }
  await command("Prepare runtime", "prepare");
  if (process.env.LAPIS_AI_TEST_GGUF) {
    await region
      .$('input[placeholder="/absolute/path/model.gguf"]')
      .setValue(process.env.LAPIS_AI_TEST_GGUF);
    await command("Import model", "import");
    const imported = region.$("button=Use imported model");
    await imported.waitForEnabled();
    await imported.click();
  } else await command("Download model", "download");
  await command("Start model", "start");
  await browser.waitUntil(
    async () => /\bserving\b/u.test(await region.getText()),
    { timeout: 30_000 },
  );
  assert.equal(saved().settings.sharing, false);
  writeFileSync(
    join(f.root, "compute-accepted.json"),
    JSON.stringify({ model, commands, sharing: false }, null, 2),
  );
  await browser.$('button[aria-label="Close settings"]').click();
  await finishMotion();
  return {
    model,
    stop: async () => {
      await openSettings();
      // Settings remounts its sections each time it opens. Do not retain the
      // initial section handle across Close settings and the next opening.
      const currentRegion = browser.$(
        '//*[@role="region"][.//*[text()="Optional compute"]]',
      );
      await browser.$("button=Stop compute").click();
      await browser.waitUntil(
        async () =>
          (await currentRegion.$('[role="status"]').getText()).trim() === "off",
        { timeout: 30_000 },
      );
      await browser.$('button[aria-label="Close settings"]').click();
      await finishMotion();
    },
  };
}
