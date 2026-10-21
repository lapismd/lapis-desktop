import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { configuration, fixture, hash, ready } from "./ai-provider-fixture.mjs";
import { openAiSettings, prepareLocal } from "./ai-local-compute-fixture.mjs";

test(
  "real local model stops explicitly and stays off after cold restart",
  {
    skip: !configuration || !process.env.LAPIS_AI_TEST_GGUF,
    timeout: 900_000,
  },
  async (context) => {
    const f = await fixture("local", context);
    const compute = await prepareLocal(f);
    await compute.stop();
    const settings = join(f.root, "profile/ai-compute/settings.json");
    const savedHash = hash(settings);
    const receipt = JSON.parse(readFileSync(settings, "utf8"));
    assert.equal(receipt.settings.sharing, false);
    await ready(f.session);
    await f.session.close(true);
    const cold = await f.launch("-compute-off");
    await ready(cold);
    await openAiSettings(cold.browser);
    const region = cold.browser.$(
      '//*[@role="region" and @aria-label="Local compute"]',
    );
    await cold.browser.waitUntil(
      async () =>
        (await region.$('[role="status"]').getText()).trim().startsWith("off"),
      {
        timeout: 30_000,
      },
    );
    assert.equal(
      hash(settings),
      savedHash,
      "Cold status must not issue another model command",
    );
    assert.ok(
      await region.$("span=Downloaded models").isExisting(),
      "Cold settings retains the downloaded model library",
    );
    await cold.browser.$('button[aria-label="Close settings"]').click();
    await cold.close(true);
    writeFileSync(
      join(f.root, "lifecycle-accepted.json"),
      JSON.stringify(
        {
          prepared: true,
          imported: true,
          started: true,
          explicitStop: true,
          coldOff: true,
          sharing: false,
          settingsSha256: savedHash,
        },
        null,
        2,
      ),
    );
  },
);
