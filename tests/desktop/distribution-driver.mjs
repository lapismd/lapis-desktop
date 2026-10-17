import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

export async function distributionCall(browser, action, ...args) {
  return browser.execute(
    ({ action, args }) =>
      globalThis.__lapisDistributionAcceptance[action](...args),
    { action, args },
  );
}
export async function distributionFixture(context, name) {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, name + "-"),
  );
  const vault = join(root, "Signed plugins café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "Alpha beta gamma\n");
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession(name, root);
  context.after(session.cleanup);
  await session.browser.$("button*=Open Vault").click();
  await session.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const refreshed = await distributionCall(session.browser, "refresh");
  assert.equal(refreshed.ok, true, JSON.stringify(refreshed));
  assert.ok(
    refreshed.value.includes("native-lifecycle"),
    JSON.stringify(refreshed),
  );
  return { root, vault, session, browser: session.browser };
}
export async function inspect(browser, id) {
  return distributionCall(browser, "inspect", id);
}
export async function pluginCommand(browser, id) {
  return browser.execute(
    (id) => globalThis.__lapisPluginAcceptance.run(id),
    id,
  );
}
export async function setEnabled(browser, id, enabled) {
  return browser.execute(
    ({ id, enabled }) =>
      globalThis.__lapisPluginAcceptance.enabled(id, enabled),
    { id, enabled },
  );
}
export async function stableTicks(browser, id) {
  const before = (await inspect(browser, id)).ticks;
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(
    (await inspect(browser, id)).ticks,
    before,
    "Retired plugin interval must stop",
  );
}
export async function persistedData(browser, vault, id) {
  const path = join(vault, ".lapis/plugins", id, "data.json");
  await browser.waitUntil(
    () => existsSync(path) && readFileSync(path, "utf8").includes("café"),
    { timeout: 10000 },
  );
  return readFileSync(path, "utf8");
}
export async function coldRestore(context, root, name) {
  const restored = await nativeSession(name, root);
  context.after(restored.cleanup);
  await restored.browser.$('[data-notes-ready="true"]').waitForDisplayed();
  return restored;
}
