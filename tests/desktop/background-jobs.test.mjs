import { test } from "node:test";
import { parse } from "yaml";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";
import { waitForEditorContents } from "./editor-readiness.mjs";
import { focusNativeWindow } from "./native-visibility.mjs";
import { Key } from "webdriverio";
import { installReleasedTasks } from "./released-job-artifact.mjs";

async function openNotesVault(session, vault, root, readinessTimeout = 5000) {
  const { browser } = session;
  const ready = browser.$('[data-notes-ready="true"]');
  const open = browser.$("button*=Open Vault");
  await browser.waitUntil(
    async () => (await ready.isDisplayed()) || (await open.isDisplayed()),
  );
  if (await open.isDisplayed()) {
    writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
    await open.click();
  }
  await ready.waitForDisplayed({ timeout: readinessTimeout });
  const selected = readFileSync(join(root, "vault-admissions.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .at(-1);
  assert.ok(selected?.sessionId, "Observe actual production vault admission");
  return selected;
}

test("native window close retains plugin jobs and explicit Quit drains the owner", async (context) => {
  const previousOwner = process.env.LAPIS_DESKTOP_METADATA_OWNER;
  delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
  context.after(() => {
    if (previousOwner === undefined)
      delete process.env.LAPIS_DESKTOP_METADATA_OWNER;
    else process.env.LAPIS_DESKTOP_METADATA_OWNER = previousOwner;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/plugin-jobs-"));
  const vault = join(root, "Vault");
  mkdirSync(join(vault, ".lapis/plugins/example"), { recursive: true });
  const source =
    "export function run(ctx) { if(ctx.state.load()) {while(true) {}} ctx.state.save(true); const note=ctx.notes.frontmatter('note.md'); ctx.notes.patchFrontmatter({path:'note.md',expectedVersion:note.version,set:{count:1}}); }";
  const manifest = JSON.stringify({
    id: "example",
    version: "1.0.0",
    name: "Native background acceptance",
    author: "Lapis Notes",
    description: "Native window lifetime acceptance",
    minAppVersion: "0.1.0",
    lapis: {
      manifestVersion: 1,
      runtime: {
        entries: {
          workspace: {
            path: "main.mjs",
            format: "esm",
            sharedDependencies: ["@lapis-notes/api"],
            requiresReloadOnUpdate: true,
          },
        },
      },
      contributes: {
        backgroundJobs: [
          {
            id: "refresh",
            title: "Refresh",
            description: "Window lifetime acceptance",
            entry: "job.js",
            schedule: { kind: "interval", seconds: 60 },
            permissions: {
              metadataRead: false,
              frontmatterRead: true,
              notifications: false,
              frontmatterFields: ["count"],
            },
          },
        ],
      },
    },
  });
  const files = Object.entries({
    "manifest.json": manifest,
    "job.js": source,
    "main.mjs":
      'import { Plugin } from "@lapis-notes/api"; export default class extends Plugin { onload() {} }',
  }).map(([path, text]) => {
    writeFileSync(join(vault, ".lapis/plugins/example", path), text);
    return {
      path,
      size: Buffer.byteLength(text),
      sha256: createHash("sha256").update(text).digest("hex"),
    };
  });
  writeFileSync(
    join(vault, ".lapis/installed-plugins.json"),
    JSON.stringify({
      schemaVersion: 1,
      plugins: {
        example: { pluginId: "example", installedVersion: "1.0.0", files },
      },
    }),
  );
  writeFileSync(join(vault, ".lapis/community-plugins.json"), '["example"]');
  writeFileSync(join(vault, "note.md"), "---\ncount: 0\n---\nBody\n");
  writeFileSync(join(vault, "Draft.md"), "Original draft note\n");
  const session = await nativeSession("plugin-jobs", root);
  context.after(session.cleanup);
  const call = (command, args = {}) =>
    session.browser.execute(
      (command, args) => globalThis.__TAURI__.core.invoke(command, args),
      command,
      args,
    );
  assert.equal((await call("shell_info")).metadataOwner, "core");
  const { browser } = session;
  const selected = await openNotesVault(session, vault, root);
  await browser.$('[data-path="Draft.md"]').click();
  const editor = browser.$('.cm-content[contenteditable="true"]');
  const original = "Original draft note\n";
  const draft = "Draft retained while hidden — café\n";
  await waitForEditorContents(browser, editor, original);
  await editor.click();
  const modifier = process.platform === "darwin" ? Key.Command : Key.Control;
  await browser.keys([modifier, "a"]);
  await browser.keys(Key.NULL);
  await editor.addValue(draft);
  await waitForEditorContents(browser, editor, draft);
  const jobs = (command) =>
    call("vault_background_jobs", { sessionId: selected.sessionId, command });
  const before = await jobs({ kind: "list" });
  const job = before.jobs[0];
  await jobs({
    kind: "configure",
    pluginId: "example",
    jobId: "refresh",
    configuration: {
      fingerprint: job.fingerprint,
      schedule: job.descriptor.schedule,
      permissions: job.descriptor.permissions,
      enabled: true,
      nativeNotifications: false,
    },
  });
  await session.requestClose();
  await session.browser.waitUntil(
    async () =>
      !(await session.browser.execute(() =>
        globalThis.__TAURI__.window.getCurrentWindow().isVisible(),
      )),
  );
  assert.equal(session.isRunning(), true);
  assert.equal(readFileSync(join(vault, "Draft.md"), "utf8"), original);
  assert.equal(
    await browser.execute(() =>
      Boolean(document.querySelector('[data-notes-ready="true"]')),
    ),
    true,
  );
  await browser.execute(() =>
    globalThis.__TAURI__.window.getCurrentWindow().show(),
  );
  await focusNativeWindow(browser);
  await waitForEditorContents(browser, editor, draft);
  await browser.keys([modifier, "s"]);
  await browser.keys(Key.NULL);
  await browser.waitUntil(
    () => readFileSync(join(vault, "Draft.md"), "utf8") === draft,
  );
  await session.requestClose();
  await browser.waitUntil(
    async () =>
      !(await browser.execute(() =>
        globalThis.__TAURI__.window.getCurrentWindow().isVisible(),
      )),
  );
  await jobs({ kind: "runNow", pluginId: "example", jobId: "refresh" });
  const deadline = Date.now() + 10000;
  const savedCount = () => {
    const text = readFileSync(join(vault, "note.md"), "utf8");
    const header = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text)?.[1];
    return header ? parse(header).count : undefined;
  };
  while (savedCount() !== 1) {
    assert.ok(Date.now() < deadline, "Hidden native job did not complete");
    await delay(25);
  }
  assert.ok(readFileSync(join(vault, "note.md"), "utf8").endsWith("Body\n"));
  assert.equal(readFileSync(join(vault, "Draft.md"), "utf8"), draft);
  await session.browser.execute(() =>
    globalThis.__TAURI__.window.getCurrentWindow().show(),
  );
  await focusNativeWindow(browser);
  assert.equal((await jobs({ kind: "list" })).runnerId, before.runnerId);
  await jobs({ kind: "runNow", pluginId: "example", jobId: "refresh" });
  await session.browser.waitUntil(
    async () =>
      (await jobs({ kind: "list" })).jobs[0].runs.at(-1)?.phase === "running",
  );
  await session.close(true);
  assert.equal(session.isRunning(), false);
});

test("released Tasks digest uses native metadata and preserves one notification across cold restart", async (context) => {
  // Clear an inherited selection so this journey qualifies the real default.
  const previousTasksOwner = process.env.LAPIS_DESKTOP_TASKS_OWNER;
  delete process.env.LAPIS_DESKTOP_TASKS_OWNER;
  context.after(() => {
    if (previousTasksOwner === undefined)
      delete process.env.LAPIS_DESKTOP_TASKS_OWNER;
    else process.env.LAPIS_DESKTOP_TASKS_OWNER = previousTasksOwner;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/released-digest-"));
  const vault = join(root, "Vault");
  mkdirSync(vault);
  await installReleasedTasks(root, vault);
  const original =
    '---\ntype: task\nid: overdue-release\ntask:\n  status: open\n  deadline: "2000-01-01"\n  plan:\n    date: "2000-01-01"\n    at: anytime\n---\n\n# Unchanged overdue task body\n';
  writeFileSync(join(vault, "zz-overdue.md"), original);
  // Force a second metadata page and include the retained recurrence matcher.
  for (let index = 0; index < 99; index++) {
    writeFileSync(
      join(vault, `completed-${String(index).padStart(3, "0")}.md`),
      `---\ntype: task\nid: complete-${index}\ntask:\n  status: completed\n  deadline: "2000-01-01"\n  plan:\n    date: "2000-01-01"\n    at: anytime\n---\nCompleted\n`,
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    join(vault, "repeat.md"),
    `---\ntype: task\nid: repeated\ntask:\n  status: open\n  repeat:\n    start: "${today}"\n    rrule: FREQ=DAILY\n    anchor: schedule\n    missed: skip\n---\nRepeats today\n`,
  );
  const control = { pluginId: "tasks", jobId: "overdue-digest" };
  const connect = async (name) => {
    const session = await nativeSession(name, root);
    context.after(session.cleanup);
    // Initial native projection of 101 task documents takes about seven seconds.
    const selected = await openNotesVault(session, vault, root, 10_000);
    const owners = await session.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("shell_info"),
    );
    assert.equal(owners.tasksOwner, "core");
    assert.equal(owners.metadataOwner, "core");
    assert.equal(owners.editingOwner, "core");
    const call = (command, args = {}) =>
      session.browser.execute(
        (command, args) => globalThis.__TAURI__.core.invoke(command, args),
        command,
        args,
      );
    const jobs = (command) =>
      call("vault_background_jobs", { sessionId: selected.sessionId, command });
    const notifications = async () => {
      const connection = await call("vault_db_open", {
        sessionId: selected.sessionId,
      });
      const args = {
        sessionId: selected.sessionId,
        connectionId: connection.connectionId,
      };
      // This session has one shared admission, already owned by the Notes App.
      // Borrow it for observation; only the App retires it during teardown.
      const reply = await call("vault_db_call", {
        ...args,
        request: { method: "listNotifications", args: [] },
      });
      assert.equal(reply.kind, "value");
      return reply.value.filter((record) => record.title === "Tasks to review");
    };
    const completed = (previous) =>
      session.browser.waitUntil(
        async () => {
          const last = (await jobs({ kind: "list" })).jobs[0]?.runs.at(-1);
          if (
            last &&
            last.id !== previous &&
            ["completed", "failed", "interrupted"].includes(last.phase)
          ) {
            assert.equal(last.phase, "completed", JSON.stringify(last));
            return true;
          }
          return false;
        },
        // The unchanged guest has a 30-second execution deadline.
        { timeout: 35_000 },
      );
    return { session, jobs, notifications, completed };
  };
  const first = await connect("released-digest");
  const initial = await first.jobs({ kind: "list" });
  assert.equal(initial.jobs.length, 1);
  assert.equal(initial.jobs[0].configuration, null);
  const browser = first.session.browser;
  await browser.$('button[aria-label="Open Tasks"]').waitForDisplayed();
  await browser.$('button[aria-label="Open settings"]').click();
  await browser.$("button=Background jobs").click();
  await browser.$("h2=Overdue task digest").waitForDisplayed();
  await browser.$("button=Approve and enable").click();
  await browser.$("button=Run now").waitForEnabled();
  await browser.$("button=Run now").click();
  await first.completed(undefined);
  const messages = await first.notifications();
  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /1 overdue task needs your attention/u);
  const checkpoint = () => {
    const directory = join(root, "profile/plugin-jobs", initial.vaultId);
    const names = readdirSync(directory).filter((name) =>
      name.endsWith(".json"),
    );
    assert.equal(names.length, 1);
    const catalog = JSON.parse(readFileSync(join(directory, names[0]), "utf8"));
    return catalog.jobs.find(
      (job) => job.plugin === "tasks" && job.descriptor.id === "overdue-digest",
    ).state;
  };
  const saved = checkpoint();
  assert.equal(saved.count, 1);
  assert.match(saved.notifiedOn, /^\d{4}-\d{2}-\d{2}$/u);
  assert.equal(readFileSync(join(vault, "zz-overdue.md"), "utf8"), original);
  const previous = (await first.jobs({ kind: "list" })).jobs[0].runs.at(-1).id;
  await first.session.close(true);
  const cold = await connect("released-digest-restored");
  assert.equal((await cold.jobs({ kind: "list" })).runnerId, initial.runnerId);
  await cold.jobs({ kind: "runNow", ...control });
  await cold.completed(previous);
  assert.deepEqual(checkpoint(), saved);
  assert.equal((await cold.notifications()).length, 1);
  assert.equal(readFileSync(join(vault, "zz-overdue.md"), "utf8"), original);
  await cold.jobs({ kind: "pause", ...control });
  await cold.session.browser.$('button[aria-label="Open Tasks"]').click();
  const planner = cold.session.browser.$('[aria-label="Task planner"]');
  await planner.waitForDisplayed();
  await planner
    .$('button[aria-label="Review"],button[aria-label^="Review —"]')
    .click();
  const completion = cold.session.browser.$(
    '[aria-label="Mark Unchanged overdue task body complete"]',
  );
  await completion.waitForDisplayed();
  await completion.click();
  await cold.session.browser.waitUntil(
    () => {
      const content = readFileSync(join(vault, "zz-overdue.md"), "utf8");
      return parse(content.split("---")[1]).task.status === "completed";
    },
    { timeout: 10_000 },
  );
  assert.equal(
    readFileSync(join(vault, "zz-overdue.md"), "utf8")
      .split("---")
      .slice(2)
      .join("---"),
    original.split("---").slice(2).join("---"),
  );
  await cold.session.close(true);
  const restored = await connect("released-digest-logbook");
  await restored.session.browser.$('button[aria-label="Open Tasks"]').click();
  const logbook = restored.session.browser.$('[aria-label="Task planner"]');
  await logbook.waitForDisplayed();
  await logbook
    .$('button[aria-label="Logbook"],button[aria-label^="Logbook —"]')
    .click();
  await restored.session.browser.waitUntil(
    () =>
      restored.session.browser.execute(() =>
        document.body.innerText.includes("Unchanged overdue task body"),
      ),
    { timeout: 10_000 },
  );
  assert.equal((await restored.notifications()).length, 1);
  await restored.session.close(true);
});
