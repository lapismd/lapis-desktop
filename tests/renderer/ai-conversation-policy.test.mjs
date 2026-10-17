import test from "node:test";
import assert from "node:assert/strict";
import { register } from "tsx/esm/api";
register();
const { validateConversationMetadata } = await import(
  "../../src/lib/ai/conversations/metadata-validation.ts"
);
const { validateAgentBindingRecord } = await import(
  "../../src/lib/ai/conversations/binding-validation.ts"
);
const { validateTranscriptEntry } = await import(
  "../../src/lib/ai/conversations/transcript-validation.ts"
);
const {
  normalizeConversationScope,
  normalizePortableVaultPath,
  conversationScopeForActiveFile,
} = await import("../../src/lib/ai/conversations/paths.ts");
const { sanitizeDurableField, MAX_DURABLE_FIELD_BYTES } = await import(
  "../../src/lib/ai/conversations/redaction.ts"
);
const {
  normalizeApprovalGrants,
  persistentDecisionFromOption,
  approvalGrantIdentity,
  persistentDecisionForRequest,
} = await import("../../src/lib/ai/conversations/approval-grants.ts");
const { ConversationWriteQueue } = await import(
  "../../src/lib/ai/conversations/transcript-store.ts"
);
const { MemoryTranscriptStore } = await import(
  "../../src/lib/ai/conversations/memory-transcript-store.ts"
);
const { ConversationRepository } = await import(
  "../../src/lib/ai/conversations/conversation-repository.ts"
);
const { effectiveAgentBinding } = await import(
  "../../src/lib/ai/conversations/binding-state.ts"
);
const BASE = {
  schemaVersion: 3,
  id: "123e4567-e89b-42d3-a456-426614174000",
  createdAt: "2026-08-19T12:00:00.000Z",
  updatedAt: "2026-08-19T12:00:00.000Z",
  status: "active",
};
const entry = (type, fields = {}) => ({
  schemaVersion: 3,
  id: "entry",
  createdAt: BASE.createdAt,
  type,
  ...fields,
});

for (const schemaVersion of [1, 2, 3])
  test(`schema ${schemaVersion} remains readable without controller identity conversion`, () => {
    const metadata = {
      ...BASE,
      schemaVersion,
      activeAgentBindingId: "old-controller-binding",
    };
    assert.equal(
      validateConversationMetadata(metadata).schemaVersion,
      schemaVersion,
    );
    assert.equal(metadata.activeAgentBindingId, "old-controller-binding");
    const binding = validateAgentBindingRecord(
      entry("binding.created", {
        schemaVersion,
        runtime: "controller",
        nativeSessionId: "controller-thread",
      }),
    );
    assert.equal(binding.nativeSessionId, "controller-thread");
    assert.equal(
      validateTranscriptEntry(
        entry("message", { schemaVersion, role: "user", text: "Saved text" }),
      ).schemaVersion,
      schemaVersion,
    );
  });

test("unknown required schemas and absolute launch paths are rejected", () => {
  assert.throws(
    () => validateConversationMetadata({ ...BASE, schemaVersion: 4 }),
    /unsupported/,
  );
  for (const notePath of [
    "../secret.md",
    "/Users/owner/secret.md",
    "C:/secret.md",
    "https://example.com",
  ])
    assert.throws(
      () =>
        validateConversationMetadata({ ...BASE, launchContext: { notePath } }),
      /vault-relative/,
    );
  assert.throws(
    () => validateConversationMetadata({ ...BASE, createdAt: "yesterday" }),
    /timestamp/,
  );
});

test("metadata preserves pin/archive semantics and enforces bounded one-line titles", () => {
  assert.equal(
    validateConversationMetadata({ ...BASE, pinned: true, status: "archived" })
      .pinned,
    true,
  );
  assert.equal(
    validateConversationMetadata({ ...BASE, pinned: false }).pinned,
    undefined,
  );
  assert.throws(
    () => validateConversationMetadata({ ...BASE, pinned: "yes" }),
    /boolean/,
  );
  for (const title of ["a\nb", "🙂".repeat(81)])
    assert.throws(
      () => validateConversationMetadata({ ...BASE, title }),
      /one line/,
    );
  assert.equal(
    validateConversationMetadata({ ...BASE, title: "🙂".repeat(80) }).title
      .length,
    160,
  );
});

test("conversation paths remain confined and hidden application files resolve outside their state directory", () => {
  assert.equal(
    normalizePortableVaultPath("Projects\\Atlas/"),
    "Projects/Atlas",
  );
  assert.equal(normalizeConversationScope("/"), "");
  for (const path of [
    "../private",
    "a//b",
    "a/./b",
    "/absolute",
    "C:/absolute",
    "file://private",
  ])
    assert.throws(() => normalizePortableVaultPath(path));
  assert.throws(
    () => normalizeConversationScope("Projects/.lapis/agents"),
    /inside .lapis/,
  );
  assert.equal(
    conversationScopeForActiveFile(
      "Projects/.lapis/agents/sessions/entry/transcript.jsonl",
    ),
    "Projects",
  );
});

test("stored grants preserve app-tool identity but provider IDs never become approval policy", () => {
  const normalized = normalizeApprovalGrants([
    {
      name: "lapis-tools-notes_search: notes_search",
      decision: "allow-always",
    },
    { name: "acp_tool", decision: "allow-always" },
    { name: "notes_search", decision: "deny-always" },
  ]);
  assert.deepEqual(normalized, [
    { name: "notes_search", decision: "deny-always" },
  ]);
  assert.equal(
    approvalGrantIdentity({
      title: "MCP: tool",
      tool: { name: "acp_tool", input: { name: "notes_search" } },
    }),
    "notes_search",
  );
  assert.equal(
    persistentDecisionForRequest(normalized, {
      tool: { name: "notes_search" },
    }),
    "deny-always",
  );
  assert.equal(persistentDecisionFromOption("provider:custom"), undefined);
  assert.equal(persistentDecisionFromOption("allow-once"), undefined);
  assert.equal(
    normalizeApprovalGrants(
      Array.from({ length: 65 }, (_, i) => ({
        name: `tool-${i}`,
        decision: "allow-always",
      })),
    ).length,
    64,
  );
  assert.throws(
    () =>
      validateConversationMetadata({
        ...BASE,
        approvalGrants: Array(65).fill({
          name: "tool",
          decision: "allow-always",
        }),
      }),
    /stored limit/,
  );
});

test("durable fields redact credentials, known secrets and local roots", () => {
  const result = sanitizeDurableField(
    {
      command: "Bearer abc.def /Users/me/vault",
      env: { TOKEN: "top-secret" },
      password: "password-value",
      output: "/Users/me/work secret-value",
    },
    {
      vaultRoot: "/Users/me/vault",
      workspaceRoot: "/Users/me/work",
      knownSecrets: ["secret-value"],
    },
  );
  assert.equal(result.redacted, true);
  for (const secret of [
    "abc.def",
    "top-secret",
    "password-value",
    "secret-value",
    "/Users/me/",
  ])
    assert.ok(!result.text.includes(secret));
  assert.ok(result.text.includes("<vault>"));
  assert.ok(result.text.includes("<workspace>"));
});

test("durable fields retain the established size bound and truncation marker", () => {
  const result = sanitizeDurableField("x".repeat(80 * 1024));
  assert.equal(result.truncated, true);
  assert.ok(
    new TextEncoder().encode(result.text).byteLength <= MAX_DURABLE_FIELD_BYTES,
  );
  assert.ok(result.text.endsWith("...[truncated]"));
});

test("transcripts cannot persist request metadata or secret question answers", () => {
  assert.throws(
    () =>
      validateTranscriptEntry(
        entry("approval.request", {
          requestId: "r",
          title: "Allow",
          options: [],
          metadata: { secret: "secret" },
        }),
      ),
    /metadata/,
  );
  assert.throws(
    () =>
      validateTranscriptEntry(
        entry("question.request", {
          requestId: "r",
          title: "Question",
          questions: [],
          answers: { secret: "value" },
        }),
      ),
    /question request/,
  );
  assert.throws(
    () =>
      validateTranscriptEntry(
        entry("question.response", {
          requestId: "r",
          status: "answered",
          answers: { secret: "value" },
        }),
      ),
    /question response/,
  );
  assert.throws(
    () =>
      validateTranscriptEntry(
        entry("message", {
          role: "user",
          text: "Hello",
          source: { sessionId: "s", runId: "r", sequence: -1 },
        }),
      ),
    /sequence/,
  );
});

test("current handoff records require exact hashes and valid projection metadata", () => {
  const context = entry("binding.context.updated", {
    agentBindingId: "binding",
    throughEntryId: "last",
    throughEntryHash: "a".repeat(64),
    cause: "handoff",
    projectionMode: "delta",
    omittedEntryCount: 0,
  });
  assert.equal(validateAgentBindingRecord(context).type, context.type);
  for (const patch of [
    { schemaVersion: 2 },
    { throughEntryHash: "wrong" },
    { projectionMode: "anything" },
    { omittedEntryCount: -1 },
  ])
    assert.throws(() => validateAgentBindingRecord({ ...context, ...patch }));
});

test("binding reduction applies config/context records without changing stored identities", () => {
  const created = entry("binding.created", {
    id: "binding",
    runtime: "controller",
    nativeSessionId: "old-thread",
  });
  const context = entry("binding.context.updated", {
    agentBindingId: "binding",
    throughEntryId: "last",
    throughEntryHash: "a".repeat(64),
    cause: "handoff",
  });
  const result = effectiveAgentBinding(
    [
      created,
      entry("binding.config.updated", {
        agentBindingId: "binding",
        model: { provider: "acp", model: "model" },
      }),
      context,
    ],
    "binding",
  );
  assert.equal(result.nativeSessionId, "old-thread");
  assert.equal(result.model.model, "model");
  assert.equal(result.context.throughEntryId, "last");
  assert.equal(created.model, undefined);
});

test("a failed queued operation releases the next writer while other conversations remain independent", async () => {
  const queue = new ConversationWriteQueue();
  const order = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const first = queue.run("a", async () => {
    order.push("first");
    await gate;
    throw new Error("write failed");
  });
  const failed = assert.rejects(first, /write failed/);
  const second = queue.run("a", async () => {
    order.push("second");
  });
  await queue.run("b", async () => {
    order.push("independent");
  });
  assert.deepEqual(order, ["first", "independent"]);
  release();
  await failed;
  await second;
  assert.deepEqual(order, ["first", "independent", "second"]);
});

test("repository redacts tool data while preserving authored text and Unicode title rules", async () => {
  const store = new MemoryTranscriptStore();
  const repository = new ConversationRepository(store, {
    knownSecrets: ["private-secret"],
  });
  const snapshot = await repository.create({
    id: BASE.id,
    scopeDir: "Projects",
    launchNotePath: "Projects/Notes/launch.md",
    now: BASE.createdAt,
  });
  assert.equal(snapshot.metadata.launchContext.notePath, "Notes/launch.md");
  const text = `  ${"🙂".repeat(85)}\nprivate-secret`;
  const saved = await repository.appendTranscript(snapshot.location, [
    entry("message", { role: "user", text }),
    entry("tool", {
      id: "tool-entry",
      toolId: "tool",
      name: "read",
      state: "completed",
      input: '{"token":"private-secret"}',
      output: "private-secret",
    }),
  ]);
  assert.equal(saved.transcript[0].text, text);
  assert.equal([...saved.metadata.title].length, 80);
  assert.equal(saved.transcript[1].redacted, true);
  assert.ok(!saved.transcript[1].input.includes("private-secret"));
  const read = await repository.read(snapshot.location);
  read.transcript[0].text = "mutated";
  assert.equal(
    (await repository.read(snapshot.location)).transcript[0].text,
    text,
  );
});
