import { expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";
import { recordPage } from "../../../src/lib/native/ai/backends/record-pages.ts";

const handle = "11111111-1111-4111-8111-111111111111";
const readHandle = "22222222-2222-4222-8222-222222222222";
const cursor = "33333333-3333-4333-8333-333333333333";
const id = (v: string) => v.repeat(32);
const reference = (kind: string, v: string) => ({ kind, id: v.repeat(64) });
const content = reference("content", "a"),
  evidence = reference("observation_batch", "b");
const conversation = {
  target: { type: "conversation", id: "opaque external identity" },
  threadId: id("c"),
  repository: null,
};
function frame(records: unknown[] = []) {
  return {
    version: 2,
    conversation,
    selection: [1, 255],
    cursor,
    session_id: id("d"),
    after_index: 0,
    next_after_index: null,
    records,
  };
}
const record = <T>(kind: string, value: T, char = "a") => ({
  reference: reference(kind, char),
  projection: { type: kind, value },
});
const completed = () => ({
  type: "message_completed",
  event_id: id("1"),
  session_id: id("d"),
  turn_id: id("2"),
  message_id: id("3"),
  role: "assistant",
  content,
});
const eventBatch = (events = [completed()]) =>
  record(
    "event_batch",
    { schema_version: 1, normalizer_version: "native-v1", evidence, events },
    "e",
  );
const body = (text = "Exact sanitized text\n") =>
  record("content", {
    schema_version: 1,
    payload: { media_type: "text", text },
  });
const reply = (data: string) =>
  JSON.stringify({ version: 1, data: { type: "conversationRecords", data } });

it("uses only the retained handle, issued cursor and numeric boundary and retains exact source text", async () => {
  const text = JSON.stringify(frame([eventBatch(), body()]));
  const invoke = vi.fn(async (_request: string) => reply(text));
  const client = new NativeConversationBackend("vault", invoke);
  const decoded = await client.readRecords(handle, readHandle, cursor, 0);
  expect(decoded.source).toBe(text);
  expect(decoded.origin).toEqual({ version: 2, conversation });
  expect(decoded.records[0]!.projection).toMatchObject({
    type: "event_batch",
    value: { events: [completed()] },
  });
  expect(JSON.parse(invoke.mock.calls[0]![0])).toEqual({
    version: 1,
    sessionId: "vault",
    operation: {
      type: "readConversationRecords",
      handle,
      readHandle,
      cursor,
      afterIndex: 0,
    },
  });
  for (const invalid of [-1, 1.5, NaN, 0x100000000])
    await expect(
      client.readRecords(handle, readHandle, cursor, invalid),
    ).rejects.toThrow(/Invalid/);
  expect(invoke).toHaveBeenCalledOnce();
});

it("keeps full-width counters and timestamps and never interprets sanitized JSON payload text as ACP", () => {
  const text = JSON.stringify(
    frame([
      record(
        "observation_batch",
        {
          schema_version: 1,
          batch_id: id("1"),
          integration: "owned_controller",
          source_instance_id: id("2"),
          sanitizer_version: "native-v1",
          representation: "sanitized_native",
          observations: [
            {
              observation_id: id("3"),
              source_sequence: "U64",
              occurred_at_millis: "I64",
              source_kind: "controller",
              source_trust: "authenticated_controller",
              payload: {
                media_type: "json",
                text: '{"sequence":18446744073709551615,"type":"activity"}',
              },
            },
          ],
        },
        "b",
      ),
    ]),
  )
    .replace('"U64"', "18446744073709551615")
    .replace('"I64"', "-9223372036854775808");
  const decoded = recordPage(text, cursor, 0),
    projection = decoded.records[0]!.projection;
  expect(projection.type).toBe("observation_batch");
  if (projection.type !== "observation_batch")
    throw new Error("expected evidence");
  expect(projection.value.observations[0]).toMatchObject({
    source_sequence: 18446744073709551615n,
    occurred_at_millis: -9223372036854775808n,
    payload: {
      media_type: "json",
      text: '{"sequence":18446744073709551615,"type":"activity"}',
    },
  });
  expect(decoded.source).toBe(text);
});

it("preserves native tool identities, attempts, input/output refs, evidence and terminal state", () => {
  const tool = {
    schema_version: 1,
    tool_call_id: id("1"),
    session_id: id("d"),
    turn_id: null,
    native_name: "read_file",
    kind: "read",
    state: "interrupted",
    attempts: [id("2")],
    input: content,
    output: null,
    evidence: [evidence],
  };
  const decoded = recordPage(
    JSON.stringify(frame([record("tool_snapshot", tool)])),
    cursor,
    0,
  );
  expect(decoded.records[0]!.projection).toEqual({
    type: "tool_snapshot",
    value: tool,
  });
});

it("retains shared-batch foreign session events for exact-session projection rather than reassigning their authors", () => {
  const foreign = { ...completed(), session_id: id("f"), event_id: id("4") };
  const decoded = recordPage(
    JSON.stringify(frame([eventBatch([completed(), foreign])])),
    cursor,
    0,
  );
  expect(decoded.records[0]!.projection).toMatchObject({
    value: { events: [completed(), foreign] },
  });
});

it("supports the original prepared-read origin without inventing a canonical identity", () => {
  const { conversation: _ignored, ...prepared } = frame();
  const decoded = recordPage(
    JSON.stringify({
      ...prepared,
      version: 1,
      conversation_request_id: id("a"),
    }),
    cursor,
    0,
  );
  expect(decoded.origin).toEqual({ version: 1, requestId: id("a") });
});

it("rejects malformed records, unknown fields, contradictory kinds and substituted boundaries", () => {
  const base = frame([body()]);
  const invalid = [
    { ...base, version: 3 },
    { ...base, cursor: handle },
    { ...base, after_index: 1 },
    { ...base, session_id: "provider-session" },
    { ...base, next_after_index: 2 },
    { ...base, records: [], next_after_index: 1 },
    { ...base, root: "/foreign" },
    { ...base, records: [body(), body()] },
    { ...base, records: Array.from({ length: 17 }, () => body()) },
    frame([record("session_snapshot", {})]),
    frame([{ ...body(), reference: evidence }]),
    frame([eventBatch([{ ...completed(), content: evidence }])]),
    frame([body("x".repeat(1024 * 1024 + 1))]),
    frame([
      record("content", {
        schema_version: 1,
        payload: { media_type: "html", text: "x" },
      }),
    ]),
    frame([
      record("content", {
        schema_version: 2,
        payload: { media_type: "text", text: "x" },
      }),
    ]),
    frame([
      record("content", {
        schema_version: 1,
        payload: { media_type: "text", text: "x" },
        actor: "foreign",
      }),
    ]),
  ];
  for (const value of invalid)
    expect(() => recordPage(JSON.stringify(value), cursor, 0)).toThrow(
      /Invalid/,
    );
});

it("rejects lossy wide integers and duplicate event identities", () => {
  const value = eventBatch();
  for (const gap of ["18446744073709551616", "1.5", "-1"]) {
    const page = JSON.stringify(
      frame([
        record(
          "event_batch",
          {
            ...value.projection.value,
            events: [
              {
                type: "capture_gap",
                event_id: id("1"),
                session_id: id("d"),
                missing_from: "FROM",
                missing_to: "TO",
              },
            ],
          },
          "e",
        ),
      ]),
    )
      .replace('"FROM"', gap)
      .replace('"TO"', "18446744073709551615");
    expect(() => recordPage(page, cursor, 0)).toThrow();
  }
  expect(() =>
    recordPage(
      JSON.stringify(frame([eventBatch([completed(), completed()])])),
      cursor,
      0,
    ),
  ).toThrow();
});
