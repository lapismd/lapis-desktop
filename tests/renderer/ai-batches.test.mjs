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
const { AcpAgentSession } = await import(
  "../../src/lib/ai/runtimes/acp/session.ts"
);
const { MemoryTranscriptStore } = await import(
  "../../src/lib/ai/conversations/memory-transcript-store.ts"
);
const { VaultTranscriptStore } = await import(
  "../../src/lib/ai/conversations/vault-transcript-store.ts"
);
const { ConversationRepository } = await import(
  "../../src/lib/ai/conversations/conversation-repository.ts"
);
const { validateTranscriptEntry } = await import(
  "../../src/lib/ai/conversations/transcript-validation.ts"
);
const { applyAgentEventToChatItems } = await import(
  "../../src/lib/ai/chat/chat-trace.ts"
);
const { projectChatItemsToTranscript } = await import(
  "../../src/lib/ai/conversations/chat-to-transcript.ts"
);
const NOW = "2026-10-18T10:00:00.000Z";
const source = { sessionId: "worker", runId: "turn", sequence: 7 };
const activity = (text) => ({
  version: 3,
  type: "activity",
  requestId: "turn",
  sessionId: "worker",
  update: {
    sessionUpdate: "agent_message_chunk",
    content: { type: "text", text },
  },
});
const snapshot = (events) => ({
  events,
  sequence: events.at(-1).sequence,
  acknowledged: 0,
  closed: false,
  failure: null,
  unresolvedRequests: [],
  cleanupFailed: false,
});
async function consume(events) {
  const session = new AcpAgentSession();
  session.consume(snapshot(events));
  await session.close();
  return Array.fromAsync(session.events());
}
const terminal = {
  version: 3,
  type: "record",
  requestId: "turn",
  sessionId: "worker",
  record: { status: "outcome_unknown", error: "receipt_unknown" },
  sessionUsable: false,
};
const message = (id, provenance) => ({
  schemaVersion: 3,
  id,
  type: "message",
  role: "assistant",
  text: id,
  createdAt: NOW,
  source: provenance,
});
async function store(kind) {
  if (kind === "memory") return { backend: new MemoryTranscriptStore() };
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  return {
    backend: new VaultTranscriptStore(vault),
    reopen: () => new VaultTranscriptStore(vault),
  };
}
async function create(backend) {
  const repository = new ConversationRepository(backend);
  return (
    await repository.create({
      id: "123e4567-e89b-42d3-a456-426614174000",
      scopeDir: "",
      now: NOW,
    })
  ).location;
}

test("production ACP consumes before/main/after in order and gives each grouped frame its own provenance", async () => {
  const events = await consume([
    { sequence: 6, frame: activity("main"), after: [activity(" tail")] },
    { sequence: 7, before: [activity(" deferred")], frame: terminal },
  ]);
  assert.deepEqual(
    events.map((event) => event.type),
    ["text", "text", "text", "error"],
  );
  assert.deepEqual(
    events.slice(0, 3).map((event) => event.text),
    ["main", " tail", " deferred"],
  );
  assert.deepEqual(
    events.map((event) => event.source),
    [
      { ...source, sequence: 6, frameIndex: 0 },
      { ...source, sequence: 6, frameIndex: 1 },
      { ...source, frameIndex: 0 },
      { ...source, frameIndex: 1 },
    ],
  );
});

test("ungrouped ACP provenance keeps its exact legacy shape, including empty optional groups", async () => {
  const events = await consume([
    { sequence: 7, before: [], frame: activity("legacy"), after: [] },
  ]);
  assert.deepEqual(events[0].source, source);
  assert.equal(Object.hasOwn(events[0].source, "frameIndex"), false);
});

for (const kind of ["memory", "vault"]) {
  test(`${kind} transcripts retain distinct frames at one cursor, deduplicate replays and preserve legacy records`, async () => {
    const { backend, reopen } = await store(kind);
    const location = await create(backend);
    const entries = [
      message("legacy", source),
      message("first", { ...source, frameIndex: 0 }),
      message("second", { ...source, frameIndex: 1 }),
    ];
    await backend.appendTranscriptEntries(location, entries);
    await backend.appendTranscriptEntries(
      location,
      entries.map((entry) => ({ ...entry, id: `${entry.id}-replay` })),
    );
    assert.deepEqual((await backend.read(location)).transcript, entries);
    if (kind === "vault") {
      const reopened = reopen();
      assert.deepEqual((await reopened.read(location)).transcript, entries);
    }
  });

  test(`${kind} production chat projection retains deferred text and terminal failure at their shared cursor`, async () => {
    const { backend, reopen } = await store(kind);
    const location = await create(backend);
    const events = await consume([
      { sequence: 7, before: [activity("Captured answer")], frame: terminal },
    ]);
    const items = events.reduce(
      (items, event) => applyAgentEventToChatItems(items, event, () => NOW),
      [],
    );
    const entries = projectChatItemsToTranscript(items);
    assert.deepEqual(
      entries.map((entry) => entry.type),
      ["message", "error"],
    );
    assert.equal(entries[0].text, "Captured answer");
    await backend.appendTranscriptEntries(location, entries);
    const retained = (await backend.read(location)).transcript;
    assert.equal(retained.length, 2);
    assert.deepEqual(
      retained.map((entry) => entry.source.frameIndex),
      [0, 1],
    );
  });
}

test("transcript frame indexes reject invalid numeric and JSON values while legacy absence stays absent", () => {
  for (const frameIndex of [
    -1,
    0.5,
    Number.MAX_SAFE_INTEGER + 1,
    "0",
    null,
    NaN,
    Infinity,
  ])
    assert.throws(
      () => validateTranscriptEntry(message("bad", { ...source, frameIndex })),
      /source.frameIndex/,
    );
  assert.deepEqual(
    validateTranscriptEntry(message("legacy", source)).source,
    source,
  );
  assert.deepEqual(
    validateTranscriptEntry(message("indexed", { ...source, frameIndex: 0 }))
      .source,
    { ...source, frameIndex: 0 },
  );
});
