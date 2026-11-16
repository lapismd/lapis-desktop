import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u;

async function invoke(session, command, request) {
  return session.browser.execute(
    async (command, request) => {
      try {
        return {
          value: await globalThis.__TAURI__.core.invoke(command, request),
        };
      } catch (error) {
        return {
          failure: {
            code: error?.code,
            message: String(error?.message ?? error),
          },
        };
      }
    },
    command,
    request,
  );
}

async function success(session, command, args = {}) {
  const reply = await invoke(session, command, args);
  assert.equal(
    reply.failure,
    undefined,
    `${command}: ${JSON.stringify(reply.failure)}`,
  );
  return reply.value;
}

async function quiet(session) {
  const info = await success(session, "shell_info");
  assert.equal(info.backgroundApi, true);
  assert.equal(info.nativeVisibility.Ok[0], false);
  assert.equal(info.nativeVisibility.Ok[4], false);
  assert.equal(await session.browser.execute(() => document.hasFocus()), false);
}

function fixture(context) {
  const previous = process.env.LAPIS_DESKTOP_SYNC_OWNER;
  process.env.LAPIS_DESKTOP_SYNC_OWNER = "core";
  context.after(() => {
    if (previous === undefined) delete process.env.LAPIS_DESKTOP_SYNC_OWNER;
    else process.env.LAPIS_DESKTOP_SYNC_OWNER = previous;
  });
  mkdirSync(".local/native-test", { recursive: true });
  const root = mkdtempSync(resolve(".local/native-test/sync-account-"));
  const vault = join(root, "Sync café 笔记");
  mkdirSync(vault);
  writeFileSync(join(vault, "Note.md"), "offline draft stays local\n");
  return { root, vault };
}

function scope(value, selected) {
  assert.deepEqual(Object.keys(value).sort(), ["handle", "observation"]);
  assert.match(value.handle, uuid);
  const { observation } = value;
  assert.deepEqual(Object.keys(observation).sort(), [
    "provider",
    "revision",
    "snapshot",
  ]);
  assert.equal(observation.provider, "lapis-server");
  assert.ok(
    Number.isSafeInteger(observation.revision) && observation.revision >= 0,
  );
  assert.deepEqual(Object.keys(observation.snapshot).sort(), [
    "account",
    "phase",
    "profileId",
    "vaultId",
  ]);
  assert.equal(observation.snapshot.phase, "unconfigured");
  assert.equal(observation.snapshot.account, null);
  assert.equal(observation.snapshot.vaultId, selected.profileId);
  assert.match(observation.snapshot.profileId, uuid);
  return observation.snapshot.profileId;
}

test(
  "native Sync admits and revokes exact presentation scopes without touching working files",
  { timeout: 60000 },
  async (context) => {
    const f = fixture(context);
    const session = await nativeSession("sync-account", f.root, undefined, [], {
      background: true,
    });
    context.after(session.cleanup);
    await quiet(session);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(session, "vault_select");
    const open = () =>
      success(session, "desktop_sync_open", {
        request: { sessionId: selected.sessionId },
      });
    const first = await open();
    const profile = scope(first, selected);
    const forged = await invoke(session, "desktop_sync_open", {
      request: { sessionId: selected.sessionId, root: f.vault },
    });
    assert.ok(forged.failure, "Renderer roots must be refused");
    const second = await open();
    assert.equal(scope(second, selected), profile);
    assert.notEqual(second.handle, first.handle);
    const stale = await invoke(session, "desktop_sync_snapshot", {
      request: { handle: first.handle },
    });
    assert.equal(stale.failure?.code, "EACCES");
    const snapshot = await success(session, "desktop_sync_snapshot", {
      request: { handle: second.handle },
    });
    assert.deepEqual(snapshot.snapshot, second.observation.snapshot);
    const observed = await success(session, "desktop_sync_observe", {
      request: { handle: second.handle },
    });
    assert.deepEqual(observed, snapshot);
    assert.equal(
      (
        await invoke(session, "desktop_sync_observe", {
          request: {
            handle: second.handle,
            afterRevision: observed.revision + 1,
          },
        })
      ).failure?.code,
      "EINVAL",
    );
    await session.browser.execute(
      (handle, revision) => {
        globalThis.__lapisSyncWaits = [];
        for (let i = 0; i < 2; i++) {
          void globalThis.__TAURI__.core
            .invoke("desktop_sync_observe", {
              request: { handle, afterRevision: revision },
            })
            .then(
              () => globalThis.__lapisSyncWaits.push("unexpected-delivery"),
              (error) => globalThis.__lapisSyncWaits.push(error?.code),
            );
        }
      },
      second.handle,
      observed.revision,
    );
    await session.browser.waitUntil(
      async () =>
        (await session.browser.execute(
          () => globalThis.__lapisSyncWaits.length,
        )) === 1,
    );
    assert.deepEqual(
      await session.browser.execute(() => globalThis.__lapisSyncWaits),
      ["EBUSY"],
    );
    await success(session, "desktop_sync_detach", {
      request: { handle: second.handle },
    });
    await session.browser.waitUntil(
      async () =>
        (await session.browser.execute(
          () => globalThis.__lapisSyncWaits.length,
        )) === 2,
    );
    assert.deepEqual(
      (await session.browser.execute(() => globalThis.__lapisSyncWaits)).sort(),
      ["EACCES", "EBUSY"],
    );
    const detached = await invoke(session, "desktop_sync_snapshot", {
      request: { handle: second.handle },
    });
    assert.equal(detached.failure?.code, "EACCES");
    const reopened = await open();
    assert.equal(scope(reopened, selected), profile);
    assert.notEqual(reopened.handle, second.handle);
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
    await quiet(session);
  },
);

test(
  "native Sync retains installation identity across cold process restart and rejects old handles",
  { timeout: 90000 },
  async (context) => {
    const f = fixture(context);
    const first = await nativeSession(
      "sync-account-first",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(first.cleanup);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(first, "vault_select");
    const before = await success(first, "desktop_sync_open", {
      request: { sessionId: selected.sessionId },
    });
    const profile = scope(before, selected);
    await first.cleanup();
    const second = await nativeSession(
      "sync-account-cold",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(second.cleanup);
    await quiet(second);
    const restored = await success(second, "vault_open_recent", {
      profileId: selected.profileId,
    });
    const stale = await invoke(second, "desktop_sync_snapshot", {
      request: { handle: before.handle },
    });
    assert.equal(stale.failure?.code, "EACCES");
    const after = await success(second, "desktop_sync_open", {
      request: { sessionId: restored.sessionId },
    });
    assert.equal(scope(after, restored), profile);
    assert.notEqual(after.handle, before.handle);
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
  },
);

test(
  "native Sync stays disabled without host selection and creates no Sync state",
  { timeout: 60000 },
  async (context) => {
    const f = fixture(context);
    delete process.env.LAPIS_DESKTOP_SYNC_OWNER;
    const session = await nativeSession(
      "sync-disabled",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    await quiet(session);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(session, "vault_select");
    const reply = await invoke(session, "desktop_sync_open", {
      request: { sessionId: selected.sessionId },
    });
    assert.equal(reply.failure?.code, "ENOTSUP");
    assert.equal(existsSync(join(f.root, "profile", "sync")), false);
    assert.equal(
      existsSync(join(f.root, "profile", ".lapis-sync-profile.identity")),
      false,
    );
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
    await quiet(session);
  },
);

test(
  "native Sync rejects a replaced private root and retains its original admitted scope",
  { timeout: 60000 },
  async (context) => {
    const f = fixture(context);
    const session = await nativeSession(
      "sync-root-replacement",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(session, "vault_select");
    const first = await success(session, "desktop_sync_open", {
      request: { sessionId: selected.sessionId },
    });
    scope(first, selected);
    const root = join(f.root, "profile", "sync");
    const retained = join(f.root, "profile", "retained-sync-root");
    renameSync(root, retained);
    mkdirSync(root);
    try {
      const snapshot = await invoke(session, "desktop_sync_snapshot", {
        request: { handle: first.handle },
      });
      assert.equal(snapshot.failure?.code, "EINVAL");
      assert.match(snapshot.failure.message, /recovery is required/);
      const reopened = await invoke(session, "desktop_sync_open", {
        request: { sessionId: selected.sessionId },
      });
      assert.equal(reopened.failure?.code, "EINVAL");
      assert.match(reopened.failure.message, /recovery is required/);
      assert.equal(existsSync(join(root, "desktop-profile.json")), false);
    } finally {
      rmSync(root, { recursive: true });
      renameSync(retained, root);
    }
    const restored = await success(session, "desktop_sync_snapshot", {
      request: { handle: first.handle },
    });
    assert.deepEqual(restored.snapshot, first.observation.snapshot);
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
    await quiet(session);
  },
);

test(
  "native Sync keeps the same scope on refused vault close and fences it after accepted close",
  { timeout: 60000 },
  async (context) => {
    const f = fixture(context);
    const session = await nativeSession(
      "sync-vault-leave",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(session, "vault_select");
    const first = await success(session, "desktop_sync_open", {
      request: { sessionId: selected.sessionId },
    });
    const profile = scope(first, selected);
    const database = await success(session, "vault_db_open", {
      sessionId: selected.sessionId,
    });
    const refused = await invoke(session, "vault_close", {
      sessionId: selected.sessionId,
    });
    assert.equal(refused.failure?.code, "EBUSY");
    const retained = await success(session, "desktop_sync_snapshot", {
      request: { handle: first.handle },
    });
    assert.deepEqual(retained.snapshot, first.observation.snapshot);
    await success(session, "vault_db_close", {
      sessionId: selected.sessionId,
      connectionId: database.connectionId,
    });
    await success(session, "vault_close", { sessionId: selected.sessionId });
    const stale = await invoke(session, "desktop_sync_snapshot", {
      request: { handle: first.handle },
    });
    assert.ok(
      stale.failure,
      "A closed native vault must revoke presentation access",
    );
    const reopened = await success(session, "vault_open_recent", {
      profileId: selected.profileId,
    });
    const next = await success(session, "desktop_sync_open", {
      request: { sessionId: reopened.sessionId },
    });
    assert.equal(scope(next, reopened), profile);
    assert.notEqual(next.handle, first.handle);
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
    await quiet(session);
  },
);

test(
  "native Sync account commands retain the owner on refused close and release it on accepted close",
  { timeout: 60000 },
  async (context) => {
    const f = fixture(context);
    const session = await nativeSession(
      "sync-account-leave",
      f.root,
      undefined,
      [],
      { background: true },
    );
    context.after(session.cleanup);
    writeFileSync(join(f.root, "picker.json"), JSON.stringify(f.vault));
    const selected = await success(session, "vault_select");
    const first = await success(session, "desktop_sync_open", {
      request: { sessionId: selected.sessionId },
    });
    let handle = first.handle;
    let request = 0;
    const call = async (operation, input = {}) => {
      const requestId = `native-account-${++request}`;
      const result = await success(session, "desktop_sync_call", {
        request: {
          handle,
          command: { provider: "lapis-server", requestId, operation, input },
        },
      });
      assert.equal(result.reply.provider, "lapis-server");
      assert.equal(result.reply.requestId, requestId);
      assert.match(result.handle, uuid);
      handle = result.handle;
      return result;
    };
    await call("account-configure", { serverOrigin: "https://sync.example" });
    const configuredHandle = handle;
    const initial = await call("account-snapshot");
    assert.equal(initial.observation.snapshot.phase, "ready");
    const account = initial.observation.snapshot.account.snapshot;
    assert.equal(account.phase, "disconnected");
    assert.equal(account.origin, "https://sync.example");
    assert.match(account.client_id, uuid);
    const database = await success(session, "vault_db_open", {
      sessionId: selected.sessionId,
    });
    assert.equal(
      (await invoke(session, "vault_close", { sessionId: selected.sessionId }))
        .failure?.code,
      "EBUSY",
    );
    assert.equal(handle, configuredHandle);
    assert.deepEqual(
      (await call("account-snapshot")).observation.snapshot.account.snapshot,
      account,
    );
    await success(session, "vault_db_close", {
      sessionId: selected.sessionId,
      connectionId: database.connectionId,
    });
    await success(session, "vault_close", { sessionId: selected.sessionId });
    assert.ok(
      (await invoke(session, "desktop_sync_snapshot", { request: { handle } }))
        .failure,
    );
    const reopened = await success(session, "vault_open_recent", {
      profileId: selected.profileId,
    });
    handle = (
      await success(session, "desktop_sync_open", {
        request: { sessionId: reopened.sessionId },
      })
    ).handle;
    await call("account-configure", { serverOrigin: "https://sync.example" });
    assert.deepEqual(
      (await call("account-snapshot")).observation.snapshot.account.snapshot,
      account,
    );
    await success(session, "vault_close", {
      sessionId: reopened.sessionId,
      reload: true,
    });
    await success(session, "vault_prepare_leave");
    const afterQuitPreparation = await success(session, "vault_open_recent", {
      profileId: selected.profileId,
    });
    const afterQuitScope = await success(session, "desktop_sync_open", {
      request: { sessionId: afterQuitPreparation.sessionId },
    });
    assert.equal(
      afterQuitScope.observation.snapshot.phase,
      "unconfigured",
      "Quit preparation must collect the positively closed detached account owner",
    );
    handle = afterQuitScope.handle;
    await call("account-configure", { serverOrigin: "https://sync.example" });
    assert.deepEqual(
      (await call("account-snapshot")).observation.snapshot.account.snapshot,
      account,
    );
    await success(session, "vault_close", {
      sessionId: afterQuitPreparation.sessionId,
    });
    assert.equal(
      readFileSync(join(f.vault, "Note.md"), "utf8"),
      "offline draft stays local\n",
    );
    await quiet(session);
  },
);
