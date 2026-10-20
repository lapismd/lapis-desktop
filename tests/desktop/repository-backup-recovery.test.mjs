import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";

const call = (session, command, request) =>
  session.browser.execute(
    (command, request) =>
      globalThis.__TAURI__.core.invoke(command, { request }),
    command,
    request,
  );
async function select(session, root, vault) {
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  return session.browser.execute(() =>
    globalThis.__TAURI__.core.invoke("vault_select"),
  );
}
async function start(session, sessionId) {
  const status = await session.browser.execute(async (sessionId) => {
    const channel = new globalThis.__TAURI__.core.Channel();
    globalThis.__backupRecoveryEvents = [];
    channel.onmessage = (value) =>
      globalThis.__backupRecoveryEvents.push(value);
    globalThis.__backupRecoveryChannel = channel;
    const initial = await globalThis.__TAURI__.core.invoke(
      "desktop_backup_start",
      { request: { sessionId }, onChange: channel },
    );
    if (!globalThis.__backupRecoveryEvents.length)
      globalThis.__backupRecoveryEvents.push(initial);
    return initial;
  }, sessionId);
  assert.equal(status.phase, "ready");
  return status.checkpoint;
}
async function automaticallySaved(session, previous) {
  let latest;
  await session.browser.waitUntil(
    async () => {
      latest = (
        await session.browser.execute(() => ({
          snapshot: globalThis.__backupRecoveryEvents.at(-1),
        }))
      ).snapshot;
      return (
        latest?.phase === "ready" &&
        latest.checkpoint?.commit !== previous.commit
      );
    },
    {
      timeout: 30000,
      timeoutMsg:
        "The native watcher must capture saved changes without an explicit capture command",
    },
  );
  return latest.checkpoint;
}
async function indexed(session, sessionId, value) {
  let complete = false;
  for (let batch = 0; batch < 20; batch++) {
    if (
      (
        await call(session, "desktop_backup_history_search", {
          sessionId,
          action: { kind: "step" },
        })
      ).complete
    ) {
      complete = true;
      break;
    }
  }
  assert.equal(
    complete,
    true,
    "The bounded immutable history scan must finish",
  );
  return call(session, "desktop_backup_history_search", {
    sessionId,
    action: {
      kind: "query",
      search: {
        expression: { type: "term", field: "content", value },
        case_sensitive: false,
        cursor: null,
        limit: 100,
      },
    },
  });
}

test(
  "native automatic capture retains admitted and external writes, recovers an unsnapshotted crash edit and drains final closure",
  { timeout: 120000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "backup-recovery-"));
    const vault = join(root, "Recovery vault");
    mkdirSync(vault);
    const file = join(vault, "Note.md");
    writeFileSync(file, "native initial retained version\n");
    const first = await nativeSession(
      "recovery-before-crash",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(first.cleanup);
    const selected = await select(first, root, vault);
    const initial = await start(first, selected.sessionId);

    writeFileSync(
      join(vault, "External.md"),
      "native external event version\n",
    );
    const external = await automaticallySaved(first, initial);
    await first.browser.execute(
      (sessionId) =>
        globalThis.__TAURI__.core.invoke("vault_fs", {
          sessionId,
          request: {
            operation: "write-text",
            path: "Note.md",
            data: "native admitted saved version\n",
          },
        }),
      selected.sessionId,
    );
    const admitted = await automaticallySaved(first, external);
    assert.equal(readFileSync(file, "utf8"), "native admitted saved version\n");

    for (const directory of [".git", ".jj", ".lapis"]) {
      mkdirSync(join(vault, directory));
      writeFileSync(
        join(vault, directory, "private-state.txt"),
        "private runtime must never be captured\n",
      );
    }
    const unchanged = await call(first, "desktop_backup_capture", {
      sessionId: selected.sessionId,
    });
    assert.deepEqual(
      unchanged.checkpoint,
      admitted,
      "Scanning private metadata must not create a checkpoint or operation",
    );

    const pid = await first.browser.execute(
      async () =>
        (await globalThis.__TAURI__.core.invoke("shell_info")).processId,
    );
    const executable = resolve(
      "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
    );
    assert.equal(
      execFileSync("/bin/ps", ["-p", String(pid), "-o", "comm="], {
        encoding: "utf8",
      }).trim(),
      executable,
      "Only this disposable native acceptance process may be crashed",
    );
    writeFileSync(file, "native crash pending saved version\n");
    process.kill(pid, "SIGKILL");
    assert.deepEqual(await first.waitForExit(), {
      code: null,
      signal: "SIGKILL",
    });

    const cold = await nativeSession(
      "recovery-after-crash",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(cold.cleanup);
    const reopened = await select(cold, root, vault);
    assert.equal(reopened.profileId, selected.profileId);
    assert.notEqual(reopened.sessionId, selected.sessionId);
    const beforeStart = await indexed(
      cold,
      reopened.sessionId,
      "native crash pending saved version",
    );
    assert.equal(
      beforeStart.hits.length,
      0,
      "The crash edit must still be unsnapshotted before recovery starts",
    );
    assert.equal(
      readFileSync(file, "utf8"),
      "native crash pending saved version\n",
    );
    const recovered = await start(cold, reopened.sessionId);
    assert.notEqual(recovered.commit, admitted.commit);
    const current = await indexed(
      cold,
      reopened.sessionId,
      "native crash pending saved version",
    );
    assert.equal(current.hits.length, 1);
    assert.equal(
      current.hits[0].record.revision.checkpoint.commit,
      recovered.commit,
    );
    const retained = await indexed(
      cold,
      reopened.sessionId,
      "native initial retained version",
    );
    assert.equal(
      retained.hits[0].record.revision.checkpoint.commit,
      initial.commit,
    );
    assert.equal(
      (
        await indexed(
          cold,
          reopened.sessionId,
          "private runtime must never be captured",
        )
      ).hits.length,
      0,
    );

    writeFileSync(
      join(vault, "Final.md"),
      "native final close barrier version\n",
    );
    await call(cold, "desktop_backup_stop", { sessionId: reopened.sessionId });
    const final = await indexed(
      cold,
      reopened.sessionId,
      "native final close barrier version",
    );
    assert.equal(
      final.hits.length,
      1,
      "Stopping must retain the final saved file without waiting for debounce",
    );
    writeFileSync(
      join(root, "recovery-receipt.json"),
      JSON.stringify(
        {
          initial,
          external,
          admitted,
          recovered,
          final: final.hits[0].record.revision.checkpoint,
        },
        null,
        2,
      ) + "\n",
    );
    await cold.close();
  },
);

test(
  "failed capture remains visible and retrying native closure retains the repaired saved file",
  { timeout: 90000 },
  async (context) => {
    const parent = resolve(
      process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
    );
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "backup-close-retry-"));
    const vault = join(root, "Retry vault");
    mkdirSync(vault);
    const path = join(vault, "Protected.md");
    writeFileSync(path, "native protected initial version\n");
    const session = await nativeSession("close-retry", root, undefined, [], {
      background: true,
    });
    context.after(session.cleanup);
    context.after(() => chmodSync(path, 0o644));
    const selected = await select(session, root, vault);
    const initial = await start(session, selected.sessionId);
    writeFileSync(path, "native protected repaired version\n");
    chmodSync(path, 0o000);
    let failure;
    await session.browser.waitUntil(
      async () => {
        failure = (
          await session.browser.execute(() => ({
            snapshot: globalThis.__backupRecoveryEvents.at(-1),
          }))
        ).snapshot;
        return failure?.phase === "failed";
      },
      {
        timeout: 30000,
        timeoutMsg:
          "An unreadable saved file must produce an observable capture failure",
      },
    );
    assert.ok(typeof failure.error === "string" && failure.error.length > 0);
    assert.equal(failure.checkpoint.commit, initial.commit);
    const stop = await session.browser.execute(
      async (sessionId) =>
        globalThis.__TAURI__.core
          .invoke("desktop_backup_stop", {
            request: { sessionId },
          })
          .then(
            () => ({ ok: true }),
            (error) => ({
              ok: false,
              message: String(error?.message ?? error),
            }),
          ),
      selected.sessionId,
    );
    assert.equal(stop.ok, false, "Final capture failure must reject closure");
    const repeated = await session.browser.execute(
      async (sessionId) =>
        globalThis.__TAURI__.core
          .invoke("desktop_backup_stop", {
            request: { sessionId },
          })
          .then(
            () => ({ ok: true }),
            () => ({ ok: false }),
          ),
      selected.sessionId,
    );
    assert.equal(
      repeated.ok,
      false,
      "An unrepaired failure must retain its original close guard",
    );
    const retainedFailure = (
      await session.browser.execute(() => ({
        snapshot: globalThis.__backupRecoveryEvents.at(-1),
      }))
    ).snapshot;
    assert.equal(retainedFailure.phase, "failed");
    chmodSync(path, 0o644);
    await call(session, "desktop_backup_stop", {
      sessionId: selected.sessionId,
    });
    const repaired = await indexed(
      session,
      selected.sessionId,
      "native protected repaired version",
    );
    assert.equal(
      repaired.hits.length,
      1,
      "Retrying closure must recapture repaired files before releasing its original owner",
    );
    assert.equal(
      readFileSync(path, "utf8"),
      "native protected repaired version\n",
    );
    assert.equal(
      (
        await indexed(
          session,
          selected.sessionId,
          "native protected initial version",
        )
      ).hits.length,
      1,
    );
    await session.close();
  },
);
