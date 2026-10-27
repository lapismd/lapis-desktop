import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { Key } from "webdriverio";
import { nativeSession } from "./native-session.mjs";
import { distributionCall, inspect } from "./distribution-driver.mjs";

export const title = "Review the native migration";
export const hostedTask = `---
type: task
id: hosted
task:
  status: open
  inbox: true
  start: anytime
---

# ${title}
`;
export const text = (path) =>
  existsSync(path) ? readFileSync(path, "utf8") : "";
export const taskCall = (browser, action, ...args) =>
  browser.execute(
    ({ action, args }) => globalThis.__lapisTasksAcceptance[action](...args),
    { action, args },
  );
export const taskRecords = async (browser, kind) =>
  (await taskCall(browser, "snapshot")).records.filter(
    (entry) => !kind || entry.command.kind === kind,
  );
export async function visibleText(browser, expected) {
  await browser.waitUntil(
    () =>
      browser.execute(
        (expected) => document.body.innerText.includes(expected),
        expected,
      ),
    { timeout: 10000, timeoutMsg: `Expected native Tasks text: ${expected}` },
  );
}
export async function planner(browser, section = "Inbox") {
  const open = browser.$('button[aria-label="Open Tasks"]');
  await open.waitForDisplayed({ timeout: 10000 });
  await open.click();
  await browser.$('[aria-label="Task planner"]').waitForDisplayed();
  await browser.$(`button=${section}`).click();
}
export const complete = (browser, name = title) =>
  browser.$(`[aria-label="Mark ${name} complete"]`);
export async function completedSubmit(browser) {
  let record;
  await browser.waitUntil(
    async () => {
      record = (await taskRecords(browser, "submit")).at(-1);
      return (
        record?.native?.kind === "operation" &&
        record.native.operation?.disposition === "completed"
      );
    },
    { timeout: 10000, timeoutMsg: "Expected real native completed operation" },
  );
  return record.native.operation;
}
export async function noReplay(browser, submits) {
  assert.equal((await taskRecords(browser, "submit")).length, submits);
  assert.equal((await taskRecords(browser, "retry")).length, 0);
}
export async function configured(browser, provider = "default") {
  let status;
  await browser.waitUntil(
    async () => {
      const reply = await taskCall(browser, "status");
      status = reply.status;
      return (
        status?.enabled && status.configuration?.provider.kind === provider
      );
    },
    { timeout: 10000 },
  );
  return status;
}
export async function taskFixture(
  context,
  name,
  files = { "Hosted.md": hostedTask },
) {
  for (const key of [
    "LAPIS_DESKTOP_TASKS_OWNER",
    "LAPIS_DESKTOP_METADATA_OWNER",
    "LAPIS_DESKTOP_EDITING_OWNER",
  ]) {
    const previous = process.env[key];
    process.env[key] = "core";
    context.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, `${name}-`),
  );
  const vault = join(root, "Installed Tasks café 笔记");
  mkdirSync(vault);
  for (const [path, contents] of Object.entries(files))
    writeFileSync(join(vault, path), contents);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const session = await nativeSession(name, root);
  const browser = session.browser;
  context.after(async () => {
    if (session.isRunning()) await taskCall(browser, "cleanup").catch(() => {});
    await session.cleanup();
  });
  await browser.$("button*=Open Vault").click();
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  const fixture = JSON.parse(
    readFileSync(".local/native-install/public.json", "utf8"),
  );
  const bundle = fixture.bundles["tasks@0.1.0"];
  assert.ok(
    bundle,
    "Compose the verified real Tasks artifact into the signed distribution fixture",
  );
  const result = await distributionCall(browser, "bundle", bundle);
  assert.equal(result.ok, true, JSON.stringify(result));
  await assertInstalled(browser);
  return { root, vault, session, browser };
}
export async function assertInstalled(browser) {
  const installed = await inspect(browser, "tasks");
  assert.equal(installed.registered, true, JSON.stringify(installed));
  assert.equal(installed.enabled, true, JSON.stringify(installed));
  assert.equal(installed.sharedApi, true);
  assert.equal(installed.diagnostics.selectedRuntimeHost, "tauri-desktop");
  const shell = await browser.execute(() =>
    globalThis.__TAURI__.core.invoke("shell_info"),
  );
  assert.equal(shell.tasksOwner, "core");
  assert.equal(shell.metadataOwner, "core");
  assert.equal(shell.editingOwner, "core");
  await configured(browser);
}
export async function coldTasks(context, root, name) {
  const session = await nativeSession(name, root);
  const browser = session.browser;
  context.after(async () => {
    if (session.isRunning()) await taskCall(browser, "cleanup").catch(() => {});
    await session.cleanup();
  });
  await browser.$('[data-notes-ready="true"]').waitForDisplayed();
  await assertInstalled(browser);
  return session;
}
export async function editSource(browser, contents) {
  await browser.execute(() =>
    globalThis.__lapisPluginAcceptance.open("Hosted.md"),
  );
  const editor = browser.$('.cm-content[contenteditable="true"]');
  await editor.waitForDisplayed();
  await editor.click();
  await browser.keys([Key.Command, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(contents);
}
export async function inspectInterrupted(browser, requestId) {
  await browser.$('button[aria-label="Open command palette"]').click();
  const dialog = browser.$('[role="dialog"]');
  await dialog.waitForDisplayed();
  await dialog.$('[role="tab"]=Actions').click();
  await dialog
    .$('[role="combobox"]')
    .setValue("Inspect interrupted task update");
  await dialog.$('[role="option"]*=Inspect interrupted task update').click();
  const option = browser.$(`[role="option"]*=${requestId}`);
  await option.waitForDisplayed();
  assert.match(await option.getText(), /Hosted\.md · complete/);
  await option.click();
  await visibleText(browser, "Native journal recorded completed");
  await visibleText(browser, "Current files may have changed");
  await browser
    .$('[role="option"]=Open current task: Hosted.md')
    .waitForDisplayed();
  await browser.keys(Key.Escape);
}
