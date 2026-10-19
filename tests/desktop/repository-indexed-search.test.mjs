import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { nativeSession } from "./native-session.mjs";
const call = (session, command, request) =>
  session.browser.execute(
    async (command, request) =>
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
const expression = {
  type: "term",
  field: "content",
  value: "rare native phrase",
};
const query = (session, id) =>
  call(session, "desktop_backup_history_search", {
    sessionId: id,
    action: {
      kind: "query",
      search: { expression, case_sensitive: false, cursor: null, limit: 100 },
    },
  });

test(
  "cold native history indexes exact saved versions and reopens without capturing later disk edits",
  { timeout: 90_000 },
  async (context) => {
    const parent = resolve(".local/native-test");
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(join(parent, "indexed-history-"));
    const vault = join(root, "Notes");
    mkdirSync(vault);
    const original = "first\nrare native phrase\nlast\n";
    writeFileSync(join(vault, "note.md"), original);
    const first = await nativeSession("history-index", root, undefined, [], {
      background: true,
    });
    context.after(first.cleanup);
    const selected = await select(first, root, vault);
    const empty = await query(first, selected.sessionId);
    assert.equal(empty.hits.length, 0);
    assert.equal(readdirSync(vault).includes(".jj"), false);
    const initial = await first.browser.execute(async (sessionId) => {
      const channel = new globalThis.__TAURI__.core.Channel();
      channel.onmessage = () => {};
      globalThis.__historyIndexChannel = channel;
      return globalThis.__TAURI__.core.invoke("desktop_backup_start", {
        request: { sessionId },
        onChange: channel,
      });
    }, selected.sessionId);
    assert.equal(initial.phase, "ready");
    const checkpoint = initial.checkpoint.commit;
    writeFileSync(join(vault, "note.md"), "later saved version\n");
    await call(first, "desktop_backup_capture", {
      sessionId: selected.sessionId,
    });
    await call(first, "desktop_backup_stop", { sessionId: selected.sessionId });
    writeFileSync(join(vault, "note.md"), "unsnapshotted disk edit\n");
    let status;
    for (let n = 0; n < 20; n++) {
      status = await call(first, "desktop_backup_history_search", {
        sessionId: selected.sessionId,
        action: { kind: "step" },
      });
      if (status.complete) break;
    }
    assert.equal(status.complete, true);
    const results = await query(first, selected.sessionId);
    assert.equal(results.hits.length, 1);
    assert.equal(results.hits[0].record.revision.checkpoint.commit, checkpoint);
    assert.equal(results.hits[0].record.path, "note.md");
    const expanded = await call(first, "desktop_backup_history_search", {
      sessionId: selected.sessionId,
      action: {
        kind: "context",
        commit: checkpoint,
        path: "note.md",
        start: 0,
        end: 3,
      },
    });
    assert.equal(expanded.text, original.trimEnd());
    assert.equal(readdirSync(vault).includes(".jj"), false);
    assert.equal(readdirSync(vault).includes(".git"), false);
    assert.equal(
      readFileSync(join(vault, "note.md"), "utf8"),
      "unsnapshotted disk edit\n",
    );
    await first.close();
    const cold = await nativeSession(
      "history-index-reopen",
      root,
      undefined,
      [],
      { background: true },
    );
    context.after(cold.cleanup);
    const reopened = await select(cold, root, vault);
    const again = await query(cold, reopened.sessionId);
    assert.equal(again.hits[0].record.revision.checkpoint.commit, checkpoint);
    assert.equal(again.status.generation, results.status.generation);
    assert.equal(
      readFileSync(join(vault, "note.md"), "utf8"),
      "unsnapshotted disk edit\n",
    );
    await cold.close();
  },
);
