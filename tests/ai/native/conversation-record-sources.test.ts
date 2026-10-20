import { expect, it } from "vitest";
import { recordSources } from "../../../src/lib/native/ai/backends/record-sources.ts";

const id = (v: string) => v.repeat(32),
  thread = id("a"),
  session = id("b");
const cursor = "11111111-1111-4111-8111-111111111111";
const ref = (kind: string, v: string) => ({ kind, id: v.repeat(64) });
function linkedSession() {
  return {
    records_cursor: cursor,
    transcripts: [],
    link: {
      schema_version: 1,
      id: id("1"),
      thread_id: thread,
      actor: id("2"),
      accepted_at_millis: 25,
      previous: null,
      active: true,
      target: {
        type: "session",
        session_id: session,
        snapshot: ref("session_snapshot", "c"),
        primary: true,
      },
    },
    snapshot: {
      schema_version: 1,
      session_id: session,
      integration: "owned_controller",
      state: "idle",
      parent_session_id: null,
      evidence: [ref("observation_batch", "d")],
      event_batches: [ref("event_batch", "e")],
      transcripts: [],
      tools: { [id("3")]: ref("tool_snapshot", "f") },
      coverage: {
        completeness: "partial",
        gaps: 2,
        redacted_fields: 3,
        truncated: true,
      },
    },
  };
}

it("decodes only native linked-session descriptors and keeps source coverage independent of pagination", () => {
  const [source] = recordSources([linkedSession()], thread);
  expect(source).toMatchObject({
    cursor,
    sessionId: session,
    linkId: id("1"),
    linkedAtMillis: 25n,
    primary: true,
    snapshotRef: ref("session_snapshot", "c"),
    integration: "owned_controller",
    state: "idle",
    coverage: {
      completeness: "partial",
      gaps: 2,
      redacted_fields: 3,
      truncated: true,
    },
  });
  expect(source!.tools).toEqual({ [id("3")]: ref("tool_snapshot", "f") });
});

it("retains multiple links to the same session as distinct original snapshot cursors", () => {
  const first = linkedSession(),
    second = linkedSession();
  second.records_cursor = "22222222-2222-4222-8222-222222222222";
  second.link.id = id("4");
  second.link.target.snapshot = ref("session_snapshot", "9");
  expect(recordSources([first, second], thread)).toHaveLength(2);
});

it("rejects replaced links, missing retained cursors and impossible coverage", () => {
  const malformed = [
    (v: ReturnType<typeof linkedSession>) => {
      v.link.thread_id = id("9");
    },
    (v: ReturnType<typeof linkedSession>) => {
      v.link.active = false;
    },
    (v: ReturnType<typeof linkedSession>) => {
      v.link.target.session_id = id("9");
    },
    (v: ReturnType<typeof linkedSession>) => {
      v.records_cursor = "unknown";
    },
    (v: ReturnType<typeof linkedSession>) => {
      v.snapshot.event_batches[0]!.kind = "content";
    },
    (v: ReturnType<typeof linkedSession>) => {
      v.snapshot.coverage.completeness = "complete";
    },
  ];
  for (const mutate of malformed) {
    const session = linkedSession();
    mutate(session);
    expect(() => recordSources([session], thread)).toThrow(/Invalid/);
  }
  expect(() =>
    recordSources([linkedSession(), linkedSession()], thread),
  ).toThrow();
  expect(() =>
    recordSources(Array.from({ length: 17 }, linkedSession), thread),
  ).toThrow();
});
