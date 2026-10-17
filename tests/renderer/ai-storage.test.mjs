import test from "node:test";
import assert from "node:assert/strict";
import { register } from "tsx/esm/api";
register();
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const { Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault");
const { VaultTranscriptStore } = await import(
  "../../src/lib/ai/conversations/vault-transcript-store.ts"
);
const { ConversationRepository } = await import(
  "../../src/lib/ai/conversations/conversation-repository.ts"
);
const { ConversationUnavailableError } = await import(
  "../../src/lib/ai/conversations/types.ts"
);
const ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER = "223e4567-e89b-42d3-a456-426614174000";
const NOW = "2026-08-16T10:00:00.000Z";
const message = (id, text = "Hello") => ({
  schemaVersion: 3,
  id,
  type: "message",
  role: "user",
  text,
  createdAt: NOW,
});
async function harness(scopeDir = "", id = ID) {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  const store = new VaultTranscriptStore(vault);
  const repository = new ConversationRepository(store);
  const snapshot = await repository.create({ id, scopeDir, now: NOW });
  return {
    vault,
    store,
    repository,
    location: snapshot.location,
    directory: [scopeDir, ".lapis/agents/sessions", id]
      .filter(Boolean)
      .join("/"),
  };
}

test("portable conversations retain their three-file layout and reopen offline", async () => {
  const h = await harness("Projects/Atlas");
  await h.repository.appendAgentRecords(h.location, [
    {
      schemaVersion: 3,
      type: "binding.created",
      id: "binding",
      runtime: "controller",
      nativeSessionId: "old-controller-id",
      createdAt: NOW,
    },
  ]);
  await h.repository.appendTranscript(h.location, [
    message("first", "Authored café"),
  ]);
  for (const file of ["metadata.yaml", "agents.jsonl", "transcript.jsonl"])
    assert.ok(h.vault.getFileByPath(`${h.directory}/${file}`));
  const reopened = await new VaultTranscriptStore(h.vault).read(h.location);
  assert.equal(reopened.metadata.title, "Authored café");
  assert.equal(reopened.metadata.activeAgentBindingId, "binding");
  assert.equal(reopened.agents[0].nativeSessionId, "old-controller-id");
  assert.deepEqual(reopened.transcript, [message("first", "Authored café")]);
});

test("only an unterminated malformed final JSONL fragment can be recovered", async () => {
  const h = await harness();
  await h.repository.appendTranscript(h.location, [message("first")]);
  const file = h.vault.getFileByPath(`${h.directory}/transcript.jsonl`);
  await h.vault.append(file, '{"partial"');
  const recovered = await h.store.read(h.location);
  assert.equal(recovered.transcript.length, 1);
  assert.equal(recovered.warnings[0].line, 2);
  await h.vault.append(file, `\n${JSON.stringify(message("later"))}\n`);
  await assert.rejects(h.store.read(h.location), ConversationUnavailableError);
});

test("invalid committed records fail instead of disappearing from history", async () => {
  const h = await harness();
  const invalid = message("invalid");
  delete invalid.text;
  await h.vault.append(
    h.vault.getFileByPath(`${h.directory}/transcript.jsonl`),
    `${JSON.stringify(invalid)}\n`,
  );
  await assert.rejects(h.store.read(h.location), /invalid record/);
});

test("a corrupt conversation stays isolated from neighboring scoped history", async () => {
  const h = await harness("Projects");
  await h.repository.create({ id: OTHER, scopeDir: "Projects", now: NOW });
  await h.vault.modify(
    h.vault.getFileByPath(`${h.directory}/metadata.yaml`),
    `schemaVersion: 999\nid: ${ID}\n`,
  );
  const all = await h.repository.list("Projects");
  assert.match(
    all.find((item) => item.location.conversationId === ID).unavailableReason,
    /unsupported/,
  );
  assert.equal(
    all.find((item) => item.location.conversationId === OTHER).metadata.id,
    OTHER,
  );
});

test("concurrent appends retain order, deduplicate provenance and keep independent scopes", async () => {
  const h = await harness("Projects");
  await h.repository.create({ id: ID, scopeDir: "Archive", now: NOW });
  const entry = {
    ...message("a"),
    source: { sessionId: "old", runId: "turn", sequence: 1 },
  };
  await Promise.all([
    h.repository.appendTranscript(h.location, [entry]),
    h.repository.appendTranscript(h.location, [
      { ...entry, id: "duplicate" },
      message("b"),
    ]),
  ]);
  assert.deepEqual(
    (await h.store.read(h.location)).transcript.map((entry) => entry.id),
    ["a", "b"],
  );
  assert.equal(
    (await h.repository.read({ scopeDir: "Archive", conversationId: ID }))
      .transcript.length,
    0,
  );
  assert.equal((await h.repository.listAll()).length, 2);
});

test("archive, pin and deletion use retained metadata and vault trash", async () => {
  const h = await harness();
  assert.equal(
    (await h.repository.archive(h.location)).metadata.status,
    "archived",
  );
  assert.equal(
    (await h.repository.writePinned(h.location, true)).metadata.pinned,
    true,
  );
  const original = h.vault.trash.bind(h.vault);
  h.vault.trash = async () => {
    throw new Error("Trash unavailable");
  };
  await assert.rejects(h.repository.delete(h.location), /Trash unavailable/);
  assert.ok(h.vault.getFolderByPath(h.directory));
  h.vault.trash = original;
  await h.repository.delete(h.location);
  assert.equal(h.vault.getFolderByPath(h.directory), null);
  assert.deepEqual(await h.repository.listAll(), []);
});

test("rejected writes do not publish successful conversation change notifications", async () => {
  const h = await harness();
  const changes = [];
  const dispose = h.repository.subscribe((change) => changes.push(change));
  const append = h.store.appendTranscriptEntries.bind(h.store);
  h.store.appendTranscriptEntries = async () => {
    throw new Error("Read only");
  };
  await assert.rejects(
    h.repository.appendTranscript(h.location, [message("failed")]),
    /Read only/,
  );
  assert.deepEqual(changes, []);
  h.store.appendTranscriptEntries = append;
  await h.repository.appendTranscript(h.location, [message("good")]);
  assert.equal(changes.length, 1);
  dispose();
});
