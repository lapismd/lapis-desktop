import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { nativeSession } from "./native-session.mjs";

async function invoke(session, command, args = {}) {
  return session.browser.execute(
    (command, args) => globalThis.__TAURI__.core.invoke(command, args),
    command,
    args,
  );
}
async function quiet(session) {
  const info = await invoke(session, "shell_info");
  assert.equal(info.backgroundApi, true);
  assert.equal(info.nativeVisibility.Ok[0], false);
  assert.equal(info.nativeVisibility.Ok[4], false);
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}
function fixture(name) {
  const parent = resolve(".local/native-test");
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, `${name}-`));
  const vault = join(root, "Notes café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "initial service checkpoint\n");
  return { root, vault };
}
async function select(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  return invoke(session, "vault_select");
}
async function start(session, selected) {
  const result = await session.browser.execute(async (sessionId) => {
    const channel = new globalThis.__TAURI__.core.Channel();
    channel.onmessage = () => {};
    globalThis.__serviceLifetimeChannel = channel;
    return globalThis.__TAURI__.core.invoke("desktop_backup_start", {
      request: { sessionId },
      onChange: channel,
    });
  }, selected.sessionId);
  assert.equal(result.phase, "ready");
  return result.checkpoint;
}
async function detach(session, selected) {
  await invoke(session, "desktop_repository_release", {
    request: { reload: true },
  });
  await invoke(session, "vault_close", {
    sessionId: selected.sessionId,
    reload: true,
  });
}
async function query(session, selected, text) {
  await invoke(session, "desktop_backup_history_search", {
    request: { sessionId: selected.sessionId, action: { kind: "step" } },
  });
  return invoke(session, "desktop_backup_history_search", {
    request: {
      sessionId: selected.sessionId,
      action: {
        kind: "query",
        search: {
          expression: { type: "term", field: "content", value: text },
          case_sensitive: false,
          cursor: null,
          limit: 100,
        },
      },
    },
  });
}
async function retained(session, selected, text) {
  let page;
  await session.browser.waitUntil(
    async () => {
      page = await query(session, selected, text);
      return page.hits.some((hit) => hit.record.path === "Note.md");
    },
    {
      timeout: 20000,
      timeoutMsg: `History must retain ${text} without starting another capture owner`,
    },
  );
  return page;
}

test(
  "hidden native backup outlives reload/detach and retains explicit stop/restart and final Quit bytes",
  { timeout: 120000 },
  async (context) => {
    const { root, vault } = fixture("service-backup-lifetime");
    const first = await nativeSession("service-backup", root, undefined, [], {
      background: true,
    });
    context.after(first.cleanup);
    const original = await select(first, root, vault);
    await start(first, original);
    await detach(first, original);
    const before = await invoke(first, "shell_info");
    await first.browser.execute(() => {
      document.documentElement.dataset.serviceReloadProbe = "old";
      setTimeout(
        () => void globalThis.__TAURI__.core.invoke("lifecycle_reload"),
        50,
      );
      return true;
    });
    await first.browser.waitUntil(
      () =>
        first.browser
          .execute(
            () =>
              !document.documentElement.dataset.serviceReloadProbe &&
              document.documentElement.dataset.shellReady === "true",
          )
          .catch(() => false),
      { timeout: 20000 },
    );
    assert.equal(
      (await invoke(first, "shell_info")).processId,
      before.processId,
    );
    await quiet(first);
    writeFileSync(join(vault, "Note.md"), "saved without a renderer client\n");
    const reading = await invoke(first, "vault_open_recent", {
      profileId: original.profileId,
    });
    // Immutable history calls do not construct a Core client or start backup.
    await retained(first, reading, "saved without a renderer client");
    writeFileSync(
      join(vault, "Note.md"),
      "final bytes from retained service Quit\n",
    );
    await first.close(true);

    const cold = await nativeSession(
      "service-backup-cold",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(cold.cleanup);
    const reopened = await invoke(cold, "vault_open_recent", {
      profileId: original.profileId,
    });
    await retained(cold, reopened, "final bytes from retained service Quit");
    await retained(cold, reopened, "saved without a renderer client");
    await start(cold, reopened);
    const request = { sessionId: reopened.sessionId };
    await invoke(cold, "desktop_backup_stop", { request });
    await invoke(cold, "desktop_backup_stop", { request });
    writeFileSync(
      join(vault, "Note.md"),
      "saved while backup is explicitly disabled\n",
    );
    await delay(2500);
    assert.equal(
      (await query(cold, reopened, "saved while backup is explicitly disabled"))
        .hits.length,
      0,
    );
    await start(cold, reopened);
    await retained(cold, reopened, "saved while backup is explicitly disabled");
    await retained(cold, reopened, "initial service checkpoint");
    await quiet(cold);
    await cold.close(true);
  },
);

test(
  "failed retained-vault preflight leaves an active native vault writable and retries its original history",
  { timeout: 90000 },
  async (context) => {
    const { root, vault } = fixture("retained-backup-preflight");
    const other = join(root, "Active notes");
    mkdirSync(other);
    writeFileSync(join(other, "Note.md"), "active vault remains usable\n");
    const session = await nativeSession(
      "retained-preflight",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    const old = await select(session, root, vault);
    await start(session, old);
    await detach(session, old);
    const current = await select(session, root, other);
    const read = () =>
      invoke(session, "vault_fs", {
        sessionId: current.sessionId,
        request: { operation: "read-text", path: "Note.md" },
      });
    assert.equal(await read(), "active vault remains usable\n");
    const file = join(vault, "Note.md");
    context.after(() => chmodSync(file, 0o644));
    writeFileSync(file, "retained preflight repaired bytes\n");
    chmodSync(file, 0o000);
    const failed = await invoke(session, "vault_prepare_leave").then(
      () => false,
      () => true,
    );
    chmodSync(file, 0o644);
    assert.equal(
      failed,
      true,
      "Unreconciled retained history must block destructive leave",
    );
    assert.equal(await read(), "active vault remains usable\n");
    await invoke(session, "vault_fs", {
      sessionId: current.sessionId,
      request: {
        operation: "write-text-if-unchanged",
        path: "Note.md",
        expected: "active vault remains usable\n",
        data: "active vault still accepts writes\n",
        options: {},
      },
    });
    assert.equal(await read(), "active vault still accepts writes\n");
    await invoke(session, "vault_prepare_leave");
    assert.equal(await read(), "active vault still accepts writes\n");
    const history = await invoke(session, "vault_open_recent", {
      profileId: old.profileId,
    });
    await retained(session, history, "retained preflight repaired bytes");
    await quiet(session);
    await session.close(true);
  },
);
