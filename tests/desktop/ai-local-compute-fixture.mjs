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
  await navigation.$("button=Compute").click();
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
  assert.equal(existsSync(join(f.root, "profile/ai-compute/compute")), false);
  const region = browser.$('[role="region"][aria-label="Local compute"]');
  assert.match(await region.getText(), /off/u);
  const model =
    process.env.LAPIS_AI_TEST_MODEL ?? "unsloth/Qwen3-0.6B-GGUF:Q4_K_M";
  await region
    .$('input[placeholder="unsloth/Qwen3-0.6B-GGUF:Q4_K_M"]')
    .setValue(model);
  const commands = [];
  let downloadBarObserved = false;
  async function command(label, action) {
    const previous = existsSync(savedPath) ? saved().request?.requestId : null;
    const button = region.$(`button=${label}`);
    await button.waitForEnabled({ timeout: 45_000 });
    await button.click();
    let receipt;
    await browser.waitUntil(
      async () => {
        if (
          action === "download" &&
          (await region.$('[role="progressbar"]').isExisting())
        )
          downloadBarObserved = true;
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
  if (
    !process.env.LAPIS_AI_TEST_GGUF ||
    process.env.LAPIS_AI_TEST_DOWNLOAD === "1"
  )
    await command("Download model", "download");
  if (process.env.LAPIS_AI_TEST_GGUF) {
    await region
      .$('input[placeholder="/absolute/path/model.gguf"]')
      .setValue(process.env.LAPIS_AI_TEST_GGUF);
    await command("Import model", "import");
  }
  if (process.env.LAPIS_AI_TEST_DOWNLOAD === "1")
    assert.equal(
      downloadBarObserved,
      true,
      "A real download must expose a visible progress bar",
    );
  await command("Start model", "start");
  await browser.waitUntil(
    () =>
      browser.execute(() =>
        /\bserving\b/u.test(
          document.querySelector(
            '[role="region"][aria-label="Local compute"] [role="status"]',
          )?.textContent ?? "",
        ),
      ),
    { timeout: 30_000 },
  );
  assert.equal(saved().settings.sharing, false);
  writeFileSync(
    join(f.root, "compute-accepted.json"),
    JSON.stringify(
      { model, commands, sharing: false, downloadBarObserved },
      null,
      2,
    ),
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
        '[role="region"][aria-label="Local compute"]',
      );
      await browser.$("button=Stop compute").click();
      await browser.waitUntil(
        async () =>
          (await currentRegion.$('[role="status"]').getText())
            .trim()
            .startsWith("off"),
        { timeout: 30_000 },
      );
      await browser.$('button[aria-label="Close settings"]').click();
      await finishMotion();
    },
  };
}
