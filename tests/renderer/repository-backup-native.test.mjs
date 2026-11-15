import test from "node:test";
import assert from "node:assert/strict";
import { nativeBackup } from "../../src/lib/native/repository/backup.ts";

function fixture(fail = false) {
  const calls = [],
    events = [];
  const app = {
    configuration: {
      basePath: ".lapis/app.json",
      async reloadFromDisk(options) {
        events.push(["reload", options]);
      },
    },
    fileEditingSessions: {
      async guard(path, work) {
        events.push(["guard", path]);
        return work();
      },
      async afterMutations(work) {
        events.push(["after"]);
        await work();
      },
    },
  };
  const service = nativeBackup(
    "opaque",
    async (command, args) => {
      calls.push([command, args]);
      if (fail && args.request.command.kind === "set_enabled")
        throw new Error("Lost selection reply");
      return {
        enabled: true,
        configuration: { kind: "version", version: "opaque-original" },
        status: { phase: "ready", checkpoint: null, error: null },
      };
    },
    app,
  );
  return { service, calls, events };
}
test("only explicit backup selection mutates the native owner and preserves its exact configuration fence", async () => {
  const f = fixture();
  assert.equal(typeof f.service.setEnabled, "function");
  await f.service.setEnabled(false);
  assert.deepEqual(
    f.calls.map(([command]) => command),
    ["desktop_repository_backup", "desktop_repository_backup"],
  );
  assert.deepEqual(f.calls[1][1], {
    request: {
      sessionId: "opaque",
      command: {
        kind: "set_enabled",
        enabled: false,
        expected: { kind: "version", version: "opaque-original" },
      },
    },
  });
  assert.deepEqual(f.events[0], ["guard", ".lapis/app.json"]);
  assert(
    f.events.some(
      ([event, options]) =>
        event === "reload" && options.materializeDefaults === false,
    ),
  );
});
test("lost selection replies reconcile status without replaying the native mutation", async () => {
  const f = fixture(true);
  await assert.rejects(f.service.setEnabled(false), /Lost selection reply/);
  assert.deepEqual(
    f.calls.map(([, args]) => args.request.command.kind),
    ["status", "set_enabled", "status"],
  );
});
test("stopping a backup observer never stops or captures the vault-owned writer", async () => {
  const f = fixture();
  await f.service.stop();
  assert.deepEqual(f.calls, []);
});
