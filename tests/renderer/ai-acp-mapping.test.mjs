import test from "node:test";
import assert from "node:assert/strict";
import {
  mapAcpActivity,
  mapAcpTerminal,
} from "../../src/lib/ai/runtimes/acp/event-mapper.ts";
import { mapAcpPermission } from "../../src/lib/ai/runtimes/acp/permissions.ts";
const source = { sessionId: "worker", runId: "prompt", sequence: 2 };

test("native ACP text, reasoning and extensions retain source and observation", () => {
  const update = {
    sessionUpdate: "agent_message_chunk",
    content: { type: "text", text: "café" },
  };
  const event = mapAcpActivity(update, source);
  assert.equal(event.type, "text");
  assert.equal(event.text, "café");
  assert.deepEqual(event.source, source);
  assert.deepEqual(event.observation, update);
  assert.equal(
    mapAcpActivity({ ...update, sessionUpdate: "agent_thought_chunk" }, source)
      .type,
    "thinking",
  );
  const custom = {
    sessionUpdate: "custom_update",
    nested: { untouched: true },
  };
  assert.deepEqual(mapAcpActivity(custom, source), {
    type: "provider_extension",
    sourceType: "custom_update",
    observation: custom,
    source,
  });
});

test("tool updates retain concrete identity, input, output, locations and failure state", () => {
  const start = mapAcpActivity(
    {
      sessionUpdate: "tool_call",
      toolCallId: "tool",
      title: "tool call",
      rawInput: { name: "notes_read", path: "note.md" },
      locations: [{ path: "note.md" }],
    },
    source,
  );
  assert.equal(start.type, "tool.start");
  assert.equal(start.name, "notes_read");
  assert.equal(start.id, "tool");
  assert.deepEqual(start.locations, [{ path: "note.md" }]);
  const end = mapAcpActivity(
    {
      sessionUpdate: "tool_call_update",
      toolCallId: "tool",
      status: "failed",
      rawOutput: { error: "Denied" },
    },
    source,
  );
  assert.equal(end.type, "tool.end");
  assert.deepEqual(end.error, { error: "Denied" });
  assert.deepEqual(end.output, { error: "Denied" });
});

test("commands and usage updates use normalized retained fields", () => {
  assert.deepEqual(
    mapAcpActivity(
      {
        sessionUpdate: "available_commands_update",
        availableCommands: [
          { name: "explain", description: "Explain", input: { hint: "topic" } },
        ],
      },
      source,
    ).commands,
    [{ name: "explain", description: "Explain", argumentHint: "topic" }],
  );
  assert.deepEqual(
    mapAcpActivity(
      { sessionUpdate: "usage_update", used: 12, size: 100 },
      source,
    ).usage,
    { used: 12, limit: 100 },
  );
  assert.equal(
    mapAcpActivity(
      { sessionUpdate: "usage_update", used: NaN, size: 0 },
      source,
    ).type,
    "provider_extension",
  );
});

test("permission mapping preserves custom IDs, unknown semantics and no invented choices", () => {
  const request = mapAcpPermission({
    version: 3,
    type: "permission",
    requestId: "prompt",
    permissionId: "live",
    request: {
      toolCall: {
        title: "Read note",
        kind: "read",
        rawInput: { path: "note.md" },
      },
      options: [
        { optionId: "provider:custom", name: "Custom", kind: "future_kind" },
        { optionId: "provider:deny", name: "Deny", kind: "reject_once" },
      ],
    },
  });
  assert.equal(request.id, "live");
  assert.equal(request.origin, "runtime");
  assert.equal(request.kind, "read");
  assert.deepEqual(request.options, [
    { id: "provider:custom", label: "Custom", kind: "unknown" },
    { id: "provider:deny", label: "Deny", kind: "deny-once" },
  ]);
  assert.deepEqual(
    mapAcpPermission({ permissionId: "empty", request: { options: [] } })
      .options,
    [],
  );
  assert.throws(
    () =>
      mapAcpPermission({
        permissionId: "bad",
        request: { options: [{ name: "No identity" }] },
      }),
    /permission option/,
  );
});

test("terminal failure or unknown outcomes never become fabricated completion", () => {
  assert.equal(
    mapAcpTerminal(
      {
        type: "record",
        record: { status: "completed", stopReason: "end_turn" },
      },
      source,
    ).type,
    "completed",
  );
  assert.equal(
    mapAcpTerminal({ type: "record", record: { status: "cancelled" } }, source)
      .result.status,
    "cancelled",
  );
  for (const status of ["failed", "invalid", "timed_out", "outcome_unknown"]) {
    const event = mapAcpTerminal(
      { type: "record", record: { status, error: "classified" } },
      source,
    );
    assert.equal(event.type, "error");
    assert.equal(
      event.error.outcome,
      status === "invalid" ? "rejected" : "unknown",
    );
  }
});
