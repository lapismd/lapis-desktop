import test from "node:test";
import assert from "node:assert/strict";
import { markApprovalResponse } from "../../src/lib/ai/chat/chat-trace.ts";
import { projectTranscriptToChatItems } from "../../src/lib/ai/conversations/transcript-to-chat.ts";
const NOW = "2026-08-16T00:00:00.000Z";
const request = (option) => ({
  id: "permission",
  kind: "read",
  title: "Read",
  options: [option],
});
for (const [id, kind, status] of [
  ["provider:deny", "deny-once", "rejected"],
  ["deny-looking-allow", "allow-once", "approved"],
  ["provider:custom", "unknown", "answered"],
]) {
  test(`live and restored approval state uses the advertised ${kind} kind for ${id}`, () => {
    const option = { id, kind, label: "Choice" };
    const permission = request(option);
    const updated = markApprovalResponse(
      [
        {
          id: "card",
          type: "approval",
          status: "pending",
          request: permission,
        },
      ],
      permission.id,
      id,
    );
    assert.equal(updated[0].status, status);
    assert.equal(updated[0].responseOptionId, id);
    const restored = projectTranscriptToChatItems([
      {
        schemaVersion: 3,
        id: "card:request",
        type: "approval.request",
        createdAt: NOW,
        requestId: permission.id,
        kind: "read",
        title: "Read",
        options: [option],
      },
      {
        schemaVersion: 3,
        id: "card:response",
        type: "approval.response",
        createdAt: NOW,
        requestId: permission.id,
        option: { id, label: "Choice" },
      },
    ]);
    assert.equal(restored[0].status, status);
  });
}

test("unadvertised live choices cannot mark a pending approval successful", () => {
  const items = [
    {
      id: "card",
      type: "approval",
      status: "pending",
      request: request({
        id: "provider:custom",
        kind: "unknown",
        label: "Custom",
      }),
    },
  ];
  assert.throws(
    () => markApprovalResponse(items, "permission", "allow-once"),
    /Unknown approval option/,
  );
  assert.equal(items[0].status, "pending");
});

test("an old orphan response remains visible without inventing an approval meaning", () => {
  const items = projectTranscriptToChatItems([
    {
      schemaVersion: 1,
      id: "card:request",
      type: "approval.request",
      createdAt: NOW,
      requestId: "permission",
      kind: "read",
      title: "Read",
      options: [],
    },
    {
      schemaVersion: 1,
      id: "card:response",
      type: "approval.response",
      createdAt: NOW,
      requestId: "permission",
      option: { id: "old-choice", label: "Historical choice" },
    },
  ]);
  assert.equal(items[0].status, "answered");
  assert.equal(items[0].responseOptionId, "old-choice");
});
