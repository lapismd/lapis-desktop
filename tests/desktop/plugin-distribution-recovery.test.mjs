import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  distributionFixture,
  distributionCall,
  inspect,
  pluginCommand,
  coldRestore,
  setEnabled,
  stableTicks,
} from "./distribution-driver.mjs";

test("failed native module load remains recoverable across a cold restart and signed update", async (context) => {
  const id = "native-failure";
  const { root, vault, session, browser } = await distributionFixture(
    context,
    "signed-failure",
  );
  const installed = await distributionCall(browser, "install", id, "1.0.0");
  assert.equal(installed.ok, true, JSON.stringify(installed));
  assert.equal(installed.value.restartRequired, true);
  const failed = await inspect(browser, id);
  assert.equal(failed.enabled, false);
  assert.equal(failed.registered, false);
  assert.match(
    failed.diagnostics.lastFailureMessage,
    /Native failed-load fixture/,
  );
  assert.equal(existsSync(join(vault, ".lapis/plugins", id, "main.mjs")), true);
  await session.close();
  const restored = await coldRestore(context, root, "signed-failure-restored");
  const after = await inspect(restored.browser, id);
  assert.equal(after.record.restartRequired, true);
  await distributionCall(restored.browser, "refresh");
  const updated = await distributionCall(
    restored.browser,
    "update",
    id,
    "2.0.0",
  );
  assert.equal(updated.ok, true, JSON.stringify(updated));
  assert.equal(updated.value.installedVersion, "2.0.0");
  // A previously failed module has no live owner to retire; explicit enable
  // remains a real user choice after recovery.
  const enabled = await restored.browser.execute(() =>
    globalThis.__lapisPluginAcceptance.enabled("native-failure", true),
  );
  assert.equal(enabled, true);
  assert.equal(await pluginCommand(restored.browser, id + ":version"), "2.0.0");
  assert.equal(
    (await inspect(restored.browser, id)).record.restartRequired,
    false,
  );
  assert.equal(
    (await inspect(restored.browser, id)).problems.some((message) =>
      message.includes("Native failed-load fixture"),
    ),
    false,
  );
  assert.equal(
    JSON.parse(
      readFileSync(join(vault, ".lapis/installed-plugins.json"), "utf8"),
    ).plugins[id].installedVersion,
    "2.0.0",
  );
  await restored.close();
});

test("native plugin admission separates unsupported runtimes and disabled supported services", async (context) => {
  const { session, browser } = await distributionFixture(
    context,
    "signed-capabilities",
  );
  for (const id of [
    "native-node",
    "native-electron",
    "native-service",
    "native-capability",
    "native-unsupported-service",
  ]) {
    const installed = await distributionCall(browser, "install", id);
    assert.equal(installed.ok, true, `${id}: ${JSON.stringify(installed)}`);
    const rejected = await inspect(browser, id);
    assert.equal(
      rejected.registered,
      false,
      `${id}: ${JSON.stringify(rejected)}`,
    );
    assert.equal(rejected.enabled, false, id);
    assert.equal(rejected.command, false, id);
    assert.equal(rejected.record.restartRequired, true, id);
    assert.ok(
      rejected.diagnostics.lastFailureMessage,
      `${id}: ${JSON.stringify(rejected)}`,
    );
    if (id === "native-unsupported-service")
      assert.match(
        rejected.diagnostics.lastFailureMessage,
        /unsupported native service: agent-runtime/,
      );
  }
  await stableTicks(browser, "native-supported-service");
  await distributionCall(browser, "service", false);
  const disabled = await distributionCall(
    browser,
    "install",
    "native-supported-service",
  );
  assert.equal(disabled.ok, true, JSON.stringify(disabled));
  const state = await inspect(browser, "native-supported-service");
  assert.equal(state.registered, false);
  assert.match(
    state.diagnostics.lastFailureMessage,
    /disabled native service: notifications/,
  );
  assert.equal(
    await setEnabled(browser, "native-supported-service", true),
    false,
  );
  await distributionCall(browser, "service", true);
  assert.equal(
    (await inspect(browser, "native-supported-service")).enabled,
    false,
  );
  assert.equal(
    await setEnabled(browser, "native-supported-service", true),
    true,
  );
  assert.equal(
    await pluginCommand(browser, "native-supported-service:version"),
    "1.0.0",
  );
  await distributionCall(
    browser,
    "uninstall",
    "native-supported-service",
    true,
  );
  await session.close();
});

test("invalid signatures, altered files, incompatible releases and bundled IDs fail before installed bytes change", async (context) => {
  const { vault, session, browser } = await distributionFixture(
    context,
    "signed-rejections",
  );
  const terminal = await inspect(browser, "terminal");
  const ai = await inspect(browser, "ai");
  assert.equal(ai.registered, true);
  assert.equal(ai.enabled, true);
  assert.equal(ai.sharedApi, true);
  const corePath = join(vault, ".lapis/core-plugins.json");
  const before = existsSync(corePath) ? readFileSync(corePath, "utf8") : null;
  for (const [id, code] of [
    ["native-invalid-signature", "signature-invalid"],
    ["native-tampered", "hash-mismatch"],
    ["native-incompatible", "compatibility-failed"],
    ["terminal", "reserved-id"],
    ["ai", "reserved-id"],
  ]) {
    const result = await distributionCall(browser, "install", id);
    assert.equal(result.ok, false, `${id}: ${JSON.stringify(result)}`);
    assert.equal(result.code, code, `${id}: ${JSON.stringify(result)}`);
    assert.equal(existsSync(join(vault, ".lapis/plugins", id)), false, id);
    assert.equal((await inspect(browser, id)).record, null, id);
  }
  assert.equal((await inspect(browser, "terminal")).enabled, terminal.enabled);
  const retainedAi = await inspect(browser, "ai");
  assert.equal(retainedAi.registered, ai.registered);
  assert.equal(retainedAi.enabled, ai.enabled);
  assert.equal(retainedAi.sharedApi, ai.sharedApi);
  assert.equal(
    existsSync(corePath) ? readFileSync(corePath, "utf8") : null,
    before,
  );
  await session.close();
});
