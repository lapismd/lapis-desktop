import { expect, it, vi } from "vitest";
import { NativeSessionRecords } from "../../../src/lib/ai/conversations/native-session-records.ts";
import type { CanonicalReadLease } from "../../../src/lib/ai/conversations/canonical-catalog.ts";
import type {
  NativeRecord,
  NativeRecordPage,
  NativeRecordRef,
  NativeSessionRecordSource,
} from "../../../src/lib/ai/conversations/native-records.ts";

const ref = (kind: NativeRecordRef["kind"], v: string): NativeRecordRef => ({
  kind,
  id: v.repeat(64),
});
const events = ref("event_batch", "a"),
  evidence = ref("observation_batch", "b"),
  content = ref("content", "c");
const sessionId = "d".repeat(32),
  cursor = "11111111-1111-4111-8111-111111111111";
const source: NativeSessionRecordSource = {
  cursor,
  sessionId,
  parentSessionId: null,
  snapshotRef: { kind: "session_snapshot", id: "e".repeat(64) },
  linkId: "f".repeat(32),
  linkedAtMillis: 1n,
  primary: true,
  integration: "owned_controller",
  state: "idle",
  eventBatches: [events],
  evidence: [evidence],
  tools: {},
  coverage: {
    completeness: "partial",
    gaps: 1,
    redacted_fields: 2,
    truncated: true,
  },
};
const event: NativeRecord = {
  reference: events,
  projection: {
    type: "event_batch",
    value: {
      schema_version: 1,
      normalizer_version: "v1",
      evidence,
      events: [
        {
          type: "message_completed",
          session_id: sessionId,
          event_id: "1".repeat(32),
          message_id: "2".repeat(32),
          turn_id: null,
          role: "assistant",
          content,
        },
      ],
    },
  },
};
const body: NativeRecord = {
  reference: content,
  projection: {
    type: "content",
    value: {
      schema_version: 1,
      payload: { media_type: "text", text: "Retained answer" },
    },
  },
};
const observation: NativeRecord = {
  reference: evidence,
  projection: {
    type: "observation_batch",
    value: {
      schema_version: 1,
      batch_id: "3".repeat(32),
      integration: "owned_controller",
      source_instance_id: "4".repeat(32),
      sanitizer_version: "v1",
      representation: "sanitized_native",
      observations: [
        {
          observation_id: "6".repeat(32),
          source_sequence: 1n,
          occurred_at_millis: null,
          source_kind: "native_api",
          source_trust: "locally_trusted_plugin",
          payload: { media_type: "json", text: "{}" },
        },
      ],
    },
  },
};
function fixture() {
  const read = {
    handle: cursor,
    snapshot: "exact native snapshot",
    identity: {
      target: { type: "conversation" as const, id: "opaque" },
      threadId: "5".repeat(32),
      repository: null,
    },
    selection: [1],
    recordSources: [source],
    view: {
      identity: {
        target: { type: "conversation" as const, id: "opaque" },
        threadId: "5".repeat(32),
        repository: null,
      },
      header: {
        reference: { kind: "thread_version", id: "a".repeat(64) },
        id: "5".repeat(32),
        title: "Native fixture",
        status: "idle" as const,
        actor: "6".repeat(32),
        acceptedAtMillis: 1n,
        previous: null,
        event: { kind: "thread_event", id: "7".repeat(64) },
        raw: {},
      },
      metadata: null,
      messages: [],
      raw: {},
    },
  };
  const page = (
    after: number,
    records: NativeRecord[],
    next: number | null,
  ): NativeRecordPage => ({
    source: `original page ${after}`,
    origin: { version: 2, conversation: read.identity },
    selection: [1],
    cursor,
    sessionId,
    afterIndex: after,
    nextAfterIndex: next,
    records,
  });
  const records = vi
    .fn<(cursor: string, after: number) => Promise<NativeRecordPage>>()
    .mockResolvedValueOnce(page(0, [event], 1))
    .mockResolvedValueOnce(page(1, [observation, body], null));
  const lease: CanonicalReadLease = {
    read,
    records,
    range: vi.fn(),
    close: vi.fn(),
  };
  return {
    lease,
    records,
    page,
    reader: new NativeSessionRecords(lease, cursor),
  };
}

it("follows only issued pages, retains exact source records and does not upgrade partial coverage", async () => {
  const { reader, records, lease } = fixture();
  await reader.loadAll();
  expect(records.mock.calls).toEqual([
    [cursor, 0],
    [cursor, 1],
  ]);
  expect(reader.record(content)).toEqual(body);
  expect(reader.pages).toEqual(["original page 0", "original page 1"]);
  expect(reader.state).toMatchObject({
    phase: "ready",
    complete: true,
    loaded: 3,
  });
  expect(reader.source.coverage).toEqual(source.coverage);
  await reader.loadMore();
  expect(records).toHaveBeenCalledTimes(2);
  expect(lease.close).not.toHaveBeenCalled();
});

it("keeps the last good page and retries the same failed boundary without publishing a partial closure", async () => {
  const { reader, records, page } = fixture();
  await reader.loadMore();
  records
    .mockReset()
    .mockResolvedValueOnce(page(1, [observation], null))
    .mockResolvedValueOnce(page(1, [observation, body], null));
  await expect(reader.loadMore()).rejects.toThrow(/closure is incomplete/);
  expect(reader.state).toMatchObject({
    phase: "error",
    complete: false,
    loaded: 1,
    nextAfterIndex: 1,
  });
  expect(reader.record(evidence)).toBeUndefined();
  expect(reader.pages).toEqual(["original page 0"]);
  await reader.loadMore();
  expect(records.mock.calls).toEqual([
    [cursor, 1],
    [cursor, 1],
  ]);
  expect(reader.state.complete).toBe(true);
});

it("refuses unrelated objects, repeated content and substituted session cursors", async () => {
  const { reader, records, page } = fixture();
  await reader.loadMore();
  const invalid: NativeRecordPage[] = [
    page(1, [event], null),
    page(1, [{ ...body, reference: ref("content", "9") }], null),
    { ...page(1, [observation, body], null), sessionId: "9".repeat(32) },
    { ...page(1, [observation, body], null), cursor: "foreign" },
  ];
  records.mockReset();
  for (const value of invalid) {
    records.mockResolvedValueOnce(value);
    await expect(reader.loadMore()).rejects.toThrow();
    expect(reader.state.loaded).toBe(1);
  }
});

it("handles synchronous read fencing as an explicit retained error without losing previous content", async () => {
  const { reader, records } = fixture();
  await reader.loadMore();
  records.mockReset().mockImplementation(() => {
    throw new Error("Conversation read is closed");
  });
  await expect(reader.loadMore()).rejects.toThrow(/closed/);
  expect(reader.state).toMatchObject({
    phase: "error",
    loaded: 1,
    nextAfterIndex: 1,
  });
  expect(reader.record(events)).toEqual(event);
});

it("requires an issued source and does not retain mutable caller-owned record objects", async () => {
  const { reader, lease } = fixture();
  expect(() => new NativeSessionRecords(lease, "foreign")).toThrow(
    /linked session/,
  );
  await reader.loadAll();
  const returned = reader.record(content)!;
  if (returned.projection.type !== "content")
    throw new Error("expected content");
  returned.projection.value.payload.text = "mutated";
  expect(reader.record(content)).toEqual(body);
});

it("coalesces concurrent requests for the same issued boundary", async () => {
  const { reader, records } = fixture();
  const first = reader.loadMore(),
    second = reader.loadMore();
  expect(first).toBe(second);
  await Promise.all([first, second]);
  expect(records).toHaveBeenCalledOnce();
  expect(reader.state).toMatchObject({ loaded: 1, nextAfterIndex: 1 });
});
