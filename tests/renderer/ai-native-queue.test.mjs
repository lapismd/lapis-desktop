import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeChatHost } from "../../src/lib/native/ai/native-chat.ts";
const selection = {
  recipient: {
    id: "reviewer",
    label: "Review helper",
    token: "jj-store-agent:7265766965776572;",
  },
  target: { id: "reviewer", agent: "opencode", executionMode: "plan" },
};
function fixture(reply = { kind: "queue", queue: null }) {
  const calls = [];
  const host = createNativeChatHost(
    {},
    { sessionId: "owned-vault" },
    async (name, args) => {
      calls.push([name, args]);
      if (reply instanceof Error) throw reply;
      return reply;
    },
  );
  return { host, calls };
}
test("native queue forwards all five generated commands through the exact owned admission", async () => {
  const f = fixture();
  assert.ok(
    f.host.queue,
    "Explicit Core chat needs its native queue transport",
  );
  const conversation = "11111111-1111-4111-8111-111111111111";
  const acceptance = "22222222-2222-4222-8222-222222222222";
  const head = "33333333-3333-4333-8333-333333333333";
  const capture = {
    version: 1,
    id: "authored-capture",
    state: "queued",
    user: {
      schemaVersion: 3,
      id: "queued-user-authored-capture",
      type: "message",
      role: "user",
      text: "Preserve this exact input",
      recipients: [selection.recipient],
      createdAt: "2026-10-27T12:00:00.000Z",
    },
    selection: { targets: [selection.target], runtime: "acp", attachments: [] },
  };
  const commands = [
    {
      kind: "accept",
      input: {
        acceptance_id: acceptance,
        conversation_id: conversation,
        after_request_id: head,
        scope_dir: "Notes",
        target_id: "opaque-native-target",
        capture,
      },
    },
    { kind: "read", conversation_id: conversation },
    { kind: "stop", conversation_id: conversation },
    {
      kind: "cancel",
      conversation_id: conversation,
      acceptance_id: acceptance,
    },
    {
      kind: "resume",
      conversation_id: conversation,
      after_request_id: head,
    },
  ];
  for (const command of commands)
    assert.deepEqual(await f.host.queue.call(command), {
      kind: "queue",
      queue: null,
    });
  assert.deepEqual(
    f.calls,
    commands.map((command) => [
      "desktop_ai_queue",
      { request: { sessionId: "owned-vault", command } },
    ]),
  );
});
test("uncertain native queue failures retain typed refusal and never retry", async () => {
  const failure = Object.assign(
    new Error("Reply lost after native acceptance"),
    { code: "ECONFLICT" },
  );
  const f = fixture(failure);
  assert.ok(f.host.queue);
  await assert.rejects(
    f.host.queue.call({ kind: "read", conversation_id: "conversation" }),
    (error) => error.code === "ECONFLICT" && error.message === failure.message,
  );
  assert.equal(f.calls.length, 1);
});
test("native queue selection returns only the exact complete host declaration despite misleading IDs", async () => {
  const f = fixture({
    kind: "targets",
    targets: [
      {
        id: "codex-looking-opaque",
        label: "Codex",
        default_mode: "read-only",
        queue_selection: selection,
      },
    ],
  });
  assert.ok(f.host.queue);
  assert.deepEqual(
    await f.host.queue.selection("codex-looking-opaque"),
    selection,
  );
  assert.deepEqual(f.calls, [
    [
      "desktop_ai_turn",
      { request: { sessionId: "owned-vault", command: { kind: "targets" } } },
    ],
  ]);
});
test("missing queue declaration never infers provider or recipient from a target name", async () => {
  const f = fixture({
    kind: "targets",
    targets: [{ id: "codex", label: "Codex", default_mode: "read-only" }],
  });
  assert.ok(f.host.queue);
  assert.equal(await f.host.queue.selection("codex"), undefined);
  assert.equal(await f.host.queue.selection("foreign-target"), undefined);
  assert.equal(f.calls.length, 2);
});
test("a non-target reply cannot fabricate native queue selection", async () => {
  const f = fixture({
    kind: "records",
    records: [],
    queue_selection: selection,
  });
  assert.ok(f.host.queue);
  assert.equal(await f.host.queue.selection("codex"), undefined);
});
