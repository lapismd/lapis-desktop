import test from "node:test";
import assert from "node:assert/strict";
import { createNativeRepository } from "../../src/lib/native/repository/services.ts";

const vault = {
  sessionId: "opaque-vault-session",
  profileId: "fixture-profile",
  path: "/not-renderer-authority",
  name: "Notes",
  resourceToken: "opaque-resources",
};

test("Repository supplies remotes without initializing a managed history reader", async () => {
  const calls = [];
  const snapshot = { revision: 4, settings: { targets: [] } };
  const service = createNativeRepository(vault, async (command, args) => {
    calls.push([command, args]);
    return snapshot;
  });
  try {
    assert.ok(
      service.remotes,
      "native Repository supplies the shared remotes service",
    );
    assert.equal(await service.remotes.read(), snapshot);
    assert.deepEqual(calls, [
      [
        "desktop_repository_remotes",
        { request: { sessionId: vault.sessionId, command: null } },
      ],
    ]);
  } finally {
    await service.close("reload");
  }
});
