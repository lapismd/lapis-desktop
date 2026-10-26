import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  invoke,
  success,
  history,
  historyResult,
  admit,
  select,
  quiet,
  jj,
  digest,
  ready,
} from "./repository-driver.mjs";
import { nativeSession } from "./native-session.mjs";

test("hidden native history preserves source pins and independent admission through reload, blocked close and restart", async (context) => {
  assert.equal(process.platform, "darwin");
  assert.equal(process.arch, "arm64");
  const parent = resolve(
    process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT ?? ".local/native-test",
  );
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, "repository-background-"));
  const vault = join(root, "Vault 笔记");
  mkdirSync(vault);
  jj(vault, ["git", "init", "--colocate"]);
  writeFileSync(join(vault, "note.md"), "First revision\n");
  jj(vault, ["describe", "-m", "first"]);
  jj(vault, ["new", "-m", "second"]);
  writeFileSync(join(vault, "note.md"), "Second revision\n");
  jj(vault, ["describe", "-m", "second"]);
  jj(vault, ["new", "-m", "working"]);
  jj(vault, ["describe", "-m", "working described"]);
  writeFileSync(join(vault, "note.md"), "Unsnapshotted draft\n");
  writeFileSync(join(vault, "untracked.txt"), "Preserve me\n");
  const before = digest(vault);
  const session = await nativeSession(
    "repository-background",
    root,
    undefined,
    [],
    { background: true },
  );
  context.after(session.cleanup);
  await quiet(session);
  const selected = await select(session, root, vault);
  assert.ok(
    (await historyResult(session, "heads", { vault: selected.sessionId }))
      .failure,
  );
  for (const extra of ["root", "generation", "window", "metadata", "cache"]) {
    assert.ok(
      (
        await invoke(session, "desktop_repository_admit", {
          request: { sessionId: selected.sessionId, [extra]: "outside" },
        })
      ).failure,
    );
  }
  const originalToken = await admit(session, selected.sessionId);
  assert.ok(
    (await invoke(session, "plugin:lapis-ai|targets")).failure,
    "History does not admit AI",
  );
  const heads = await history(session, "heads", { vault: selected.sessionId });
  assert.ok(heads.heads.length);
  const status = JSON.parse(
    await success(session, "desktop_repository_working_copy", {
      request: { sessionId: selected.sessionId },
    }),
  );
  assert.equal(status.operation, heads.heads[0]);
  assert.equal(status.files, 2);
  assert.deepEqual(status.lines, { additions: 2, deletions: 1 });
  assert.equal(status.commit.description.trim(), "working described");
  assert.deepEqual(digest(vault), before, "Status cannot snapshot dirty files");
  for (const key of ["root", "workspace", "operation", "generation"]) {
    assert.ok(
      (
        await invoke(session, "desktop_repository_working_copy", {
          request: { sessionId: selected.sessionId, [key]: "outside" },
        })
      ).failure,
    );
  }
  const handle = await history(session, "open", {
    vault: selected.sessionId,
    operation: heads.heads[0],
  });
  const pinned = await ready(session, selected.sessionId, handle);
  assert.equal(pinned.operation, heads.heads[0]);
  const page = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: {
      kind: "graph",
      query: [
        {
          graph: "log",
          revset: "all()",
          user_email: "fixture@invalid",
          at_time_millis: Date.now(),
        },
        { limit: 100 },
      ],
    },
  });
  assert.equal(page.kind, "graph");
  const nodes = page.data.data.nodes.map((n) => n.commit);
  const first = nodes.find((n) => n.description.trim() === "first");
  const second = nodes.find((n) => n.description.trim() === "second");
  assert.ok(first && second);
  const diff = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: {
      kind: "diff",
      query: { from: first.id, to: second.id, path: "note.md", content: true },
    },
  });
  assert.equal(diff.kind, "diff");
  assert.match(JSON.stringify(diff), /First revision/);
  assert.match(JSON.stringify(diff), /Second revision/);
  assert.deepEqual(
    digest(vault),
    before,
    "History cannot snapshot or mutate dirty source files",
  );
  for (const bad of [
    JSON.stringify({ version: 2, data: { vault: originalToken } }),
    JSON.stringify({
      version: 1,
      data: { vault: originalToken, root: "/outside" },
    }),
  ])
    assert.ok(
      (
        await invoke(session, "desktop_repository_read", {
          request: {
            sessionId: selected.sessionId,
            method: "heads",
            frame: bad,
          },
        })
      ).failure,
    );
  jj(vault, ["describe", "-m", "external advance"]);
  const advanced = await history(session, "heads", {
    vault: selected.sessionId,
  });
  assert.notDeepEqual(advanced.heads, heads.heads);
  assert.equal(
    (await history(session, "status", { vault: selected.sessionId, handle }))
      .data.operation,
    pinned.operation,
  );
  const beforeOperationReads = digest(vault);
  // The independently registered Op Log uses the same admitted pinned
  // transport, with native operation ancestry and exact parent deltas.
  const operations = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: { kind: "graph", query: [{ graph: "operations" }, { limit: 100 }] },
  });
  assert.equal(operations.kind, "graph");
  assert.equal(operations.data.operation, pinned.operation);
  assert.equal(operations.data.data.graph, "operations");
  const selectedOperation = operations.data.data.nodes.find(
    (node) => node.id === pinned.operation,
  );
  assert.ok(selectedOperation);
  assert.ok(selectedOperation.parents.length);
  const operationDelta = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: {
      kind: "operation_diff",
      query: {
        operation: selectedOperation.id,
        parent: selectedOperation.parents[0],
      },
    },
  });
  assert.equal(operationDelta.kind, "operation_diff");
  assert.equal(operationDelta.data.data.operation, selectedOperation.id);
  assert.equal(operationDelta.data.data.parent, selectedOperation.parents[0]);
  assert.ok(operationDelta.data.data.visible_commits);
  assert.equal(operationDelta.data.data.status, "difference");
  const groups = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: {
      kind: "operation_changes",
      query: {
        operation: selectedOperation.id,
        parent: selectedOperation.parents[0],
        limit: 100,
        anchor: null,
        direction: "forward",
      },
    },
  });
  assert.equal(groups.kind, "operation_changes");
  assert.equal(groups.data.operation, selectedOperation.id);
  assert.equal(groups.data.parent, selectedOperation.parents[0]);
  assert.ok(groups.data.groups.length);
  const exact = groups.data.groups.find(
    (group) => group.comparison.status === "exact",
  );
  assert.ok(exact, "Native operation supplies an exact revision pair");
  const paths = await history(session, "read", {
    vault: selected.sessionId,
    handle,
    query: {
      kind: "diff_paths",
      query: {
        from: exact.comparison.from,
        to: exact.comparison.to,
        path: "",
        limit: 100,
        anchor: null,
        direction: "forward",
      },
    },
  });
  assert.equal(paths.kind, "diff_paths");
  assert.equal(paths.data.from, exact.comparison.from);
  assert.equal(paths.data.to, exact.comparison.to);
  assert.deepEqual(
    digest(vault),
    beforeOperationReads,
    "Operation reads cannot snapshot dirty source files or advance the explicit pin",
  );
  const { connectionId } = await success(session, "vault_db_open", {
    sessionId: selected.sessionId,
  });
  assert.equal(
    (await invoke(session, "vault_close", { sessionId: selected.sessionId }))
      .failure.code,
    "EBUSY",
  );
  assert.equal(
    (await history(session, "status", { vault: selected.sessionId, handle }))
      .state,
    "ready",
  );
  await success(session, "vault_db_close", {
    sessionId: selected.sessionId,
    connectionId,
  });
  await success(session, "desktop_repository_release", {
    request: { reload: true },
  });
  assert.ok(
    (
      await invoke(session, "desktop_repository_working_copy", {
        request: { sessionId: selected.sessionId },
      })
    ).failure,
    "Released admission cannot authorize a physical status scan",
  );
  assert.ok(
    (await historyResult(session, "heads", { vault: selected.sessionId }))
      .failure,
  );
  await admit(session, selected.sessionId);
  const reloaded = await history(session, "heads", {
    vault: selected.sessionId,
  });
  assert.equal(reloaded.generation, heads.generation);
  assert.ok(
    (
      await historyResult(session, "status", {
        vault: selected.sessionId,
        handle,
      })
    ).failure,
  );
  const pending = await history(session, "open", {
    vault: selected.sessionId,
    operation: reloaded.heads[0],
  });
  await success(session, "vault_close", { sessionId: selected.sessionId });
  assert.ok(
    (
      await historyResult(session, "status", {
        vault: selected.sessionId,
        handle: pending,
      })
    ).failure,
  );
  const next = await select(session, root, vault);
  await admit(session, next.sessionId);
  assert.notEqual(
    (await history(session, "heads", { vault: next.sessionId })).generation,
    heads.generation,
    "Core source epochs are opaque hashes, not ordered counters",
  );
  assert.ok(
    (
      await historyResult(
        session,
        "heads",
        { vault: originalToken },
        next.sessionId,
      )
    ).failure,
    "A retained Original token cannot use a newly admitted outer session",
  );
  const parked = join(root, "Replaced vault");
  renameSync(vault, parked);
  mkdirSync(vault);
  assert.ok(
    (await historyResult(session, "heads", { vault: next.sessionId })).failure,
  );
  await quiet(session);
  await session.close(true);
  const cold = await nativeSession("repository-cold", root, undefined, [], {
    background: true,
  });
  context.after(cold.cleanup);
  await quiet(cold);
  assert.ok(
    (await historyResult(cold, "heads", { vault: next.sessionId })).failure,
    "No admission survives restart",
  );
  const restored = await select(cold, root, parked);
  await admit(cold, restored.sessionId);
  assert.ok(
    (await history(cold, "heads", { vault: restored.sessionId })).heads.length,
  );
  for (const closeFirst of [false, true]) {
    const raceVault = closeFirst ? await select(cold, root, parked) : restored;
    if (closeFirst) await admit(cold, raceVault.sessionId);
    const open = () =>
      invoke(cold, "vault_db_open", { sessionId: raceVault.sessionId });
    const close = () =>
      invoke(cold, "vault_close", { sessionId: raceVault.sessionId });
    const results = await Promise.all(
      closeFirst ? [close(), open()] : [open(), close()],
    );
    const opened = results[closeFirst ? 1 : 0],
      closed = results[closeFirst ? 0 : 1];
    if (opened.failure === null) {
      assert.equal(closed.failure?.code, "EBUSY");
      assert.ok(
        (await history(cold, "heads", { vault: raceVault.sessionId })).heads
          .length,
        "A database blocker must retain history authority",
      );
      await success(cold, "vault_db_close", {
        sessionId: raceVault.sessionId,
        connectionId: opened.value.connectionId,
      });
      await success(cold, "vault_close", { sessionId: raceVault.sessionId });
    } else {
      assert.equal(closed.failure, null);
      assert.equal(opened.failure.code, "EACCES");
      assert.ok(
        (await historyResult(cold, "heads", { vault: raceVault.sessionId }))
          .failure,
      );
    }
  }
  await quiet(cold);
  await cold.close(true);
  rmSync(vault, { recursive: true });
  console.log(`Background repository history evidence: ${root}`);
});
