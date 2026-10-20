import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

async function select(session, root, path) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(path));
  return session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("vault_select"),
  );
}
const request = (session, command, value) =>
  session.browser.execute(
    (command, request) =>
      globalThis.__TAURI__.core.invoke(command, { request }),
    command,
    value,
  );
async function start(session, selected) {
  const status = await session.browser.execute((sessionId) => {
    const channel = new globalThis.__TAURI__.core.Channel();
    channel.onmessage = () => {};
    globalThis.__backupIdentityChannel = channel;
    return globalThis.__TAURI__.core.invoke("desktop_backup_start", {
      request: { sessionId },
      onChange: channel,
    });
  }, selected.sessionId);
  assert.equal(status.phase, "ready");
  assert.match(status.checkpoint.commit, /^[a-f0-9]{40}$/u);
  const storage = await request(session, "desktop_backup_storage", {
    sessionId: selected.sessionId,
    action: { kind: "status" },
  });
  assert.equal(storage.location, "external");
  assert.equal(storage.pending, null);
  assert.ok(storage.canReveal && existsSync(storage.repositoryPath));
  assert.ok(relative(selected.path, storage.repositoryPath).startsWith(".."));
  for (const name of [".jj", ".git"])
    assert.equal(existsSync(join(selected.path, name)), false);
  return {
    commit: status.checkpoint.commit,
    repository: storage.repositoryPath,
  };
}
async function closeVault(session, selected, started = false) {
  if (started)
    await request(session, "desktop_backup_stop", {
      sessionId: selected.sessionId,
    });
  await session.browser.execute(
    (sessionId) =>
      globalThis.__TAURI__.core.invoke("vault_close", { sessionId }),
    selected.sessionId,
  );
}
function note(path) {
  mkdirSync(path);
  writeFileSync(
    join(path, "Note.md"),
    "# Same note, independent physical vault\n",
  );
}

test(
  "cold native vault history identity survives recent eviction and physical relinking without aliasing a replacement folder",
  { timeout: 120000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "backup-identity-"));
    const vault = join(root, "Original vault");
    note(vault);
    const first = await nativeSession("identity-before", root, undefined, [], {
      background: true,
    });
    context.after(first.cleanup);
    const original = await select(first, root, vault);
    const retained = await start(first, original);
    await closeVault(first, original, true);
    for (let i = 0; i < 20; i++) {
      const other = join(root, `Recent ${i}`);
      note(other);
      const selected = await select(first, root, other);
      assert.notEqual(selected.profileId, original.profileId);
      await closeVault(first, selected);
    }
    const recents = await first.browser.execute(() =>
      globalThis.__TAURI__.core.invoke("vault_recents"),
    );
    assert.equal(recents.length, 20);
    assert.equal(
      recents.some(({ id }) => id === original.profileId),
      false,
      "Actual recent-list eviction must precede cold reopening",
    );
    await first.close();

    const cold = await nativeSession("identity-cold", root, undefined, [], {
      background: true,
    });
    context.after(cold.cleanup);
    const reopened = await select(cold, root, vault);
    assert.equal(reopened.profileId, original.profileId);
    assert.deepEqual(await start(cold, reopened), retained);
    await closeVault(cold, reopened, true);

    const moved = join(root, "Relinked vault café");
    renameSync(vault, moved);
    const relinked = await select(cold, root, moved);
    assert.equal(relinked.profileId, original.profileId);
    assert.equal(relinked.path, moved);
    assert.deepEqual(
      await start(cold, relinked),
      retained,
      "Reselecting the same physical vault retains original history after a folder move",
    );
    await closeVault(cold, relinked, true);

    note(vault);
    const replacement = await select(cold, root, vault);
    assert.notEqual(replacement.profileId, original.profileId);
    const independent = await start(cold, replacement);
    assert.notEqual(
      independent.repository,
      retained.repository,
      "Identical bytes at the old path must use separate history for the new physical vault",
    );
    await closeVault(cold, replacement, true);
    writeFileSync(
      join(root, "identity-receipt.json"),
      JSON.stringify(
        {
          original: original.profileId,
          retained,
          relinked: relinked.profileId,
          replacement: replacement.profileId,
          independent,
        },
        null,
        2,
      ) + "\n",
    );
    await cold.close();
  },
);
