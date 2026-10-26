import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeEditingIntents } from "../../src/lib/native/editing/intents.ts";

const selected = { sessionId: "admitted-session" };

test("editing calls and authoritative snapshots retain the same vault admission", async () => {
  const calls = [];
  const state = { kind: "missing" };
  const snapshot = {
    path: "Note.md",
    text: "saved",
    version: "native-version",
  };
  const port = createNativeEditingIntents(selected, async (command, args) => {
    calls.push([command, args]);
    return command === "vault_editing_intents" ? state : snapshot;
  });
  assert.equal(await port.call({ kind: "list" }), state);
  assert.equal(await port.read("Note.md"), snapshot);
  assert.deepEqual(calls, [
    [
      "vault_editing_intents",
      { sessionId: "admitted-session", command: { kind: "list" } },
    ],
    [
      "vault_editing_snapshot",
      { sessionId: "admitted-session", path: "Note.md" },
    ],
  ]);
});

test("native expected absence remains distinct from an empty saved file", async () => {
  const port = createNativeEditingIntents(selected, async () => null);
  assert.equal(await port.read("missing.md"), null);
  const empty = createNativeEditingIntents(selected, async () => ({
    path: "empty.md",
    text: "",
    version: "empty-version",
  }));
  assert.equal((await empty.read("empty.md")).text, "");
});

test("native permission and transport failures never become expected absence", async () => {
  for (const command of ["call", "read"]) {
    let calls = 0;
    const port = createNativeEditingIntents(selected, async () => {
      calls++;
      throw { code: "EACCES", message: "Vault admission is closed" };
    });
    await assert.rejects(
      command === "read" ? port.read("Note.md") : port.call({ kind: "list" }),
      (error) => error.code === "EACCES" && /closed/.test(error.message),
    );
    assert.equal(calls, 1, "The adapter must not retry or fall back");
  }
});

test("malformed or cross-path snapshots fail closed", async () => {
  for (const value of [
    undefined,
    {},
    { path: "other.md", text: "saved", version: "v" },
    { path: "Note.md", text: 1, version: "v" },
    { path: "Note.md", text: "saved" },
  ]) {
    const port = createNativeEditingIntents(selected, async () => value);
    await assert.rejects(
      port.read("Note.md"),
      /Invalid native editing snapshot/,
    );
  }
});
