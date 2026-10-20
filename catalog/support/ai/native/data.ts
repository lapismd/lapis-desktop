import {
  id,
  uuid,
  ref,
  owner,
  summary,
  selection,
  payload,
  record,
  event,
  observation,
  linkedSession,
  longAnswer,
} from "./facts.ts";

export function nativeData(readNumber = 1) {
  const firstCursor = uuid(100 + readNumber * 2),
    secondCursor = uuid(101 + readNumber * 2);
  const first = linkedSession(
    10,
    firstCursor,
    20,
    30,
    { [id(40)]: ref("tool_snapshot", 40), [id(41)]: ref("tool_snapshot", 41) },
    true,
  );
  const second = linkedSession(11, secondCursor, 21, 31, {});
  const message = (n: number, role: string, content: number, session = 10) =>
    event(n, session, {
      type: "message_completed",
      message_id: id(n + 200),
      turn_id: id(80),
      role,
      content: ref("content", content),
    });
  const tools = [40, 41].map((n) =>
    record("tool_snapshot", n, {
      schema_version: 1,
      tool_call_id: id(n),
      session_id: id(10),
      turn_id: id(80),
      native_name: n === 40 ? "read_note" : "collect_follow_up",
      kind: n === 40 ? "read" : "execute",
      state: n === 40 ? "succeeded" : "running",
      attempts: [id(n + 50)],
      input: ref("content", n + 10),
      output: n === 40 ? ref("content", 60) : null,
      evidence: [ref("observation_batch", 30)],
    }),
  );
  const firstRecords = [
    record("event_batch", 20, {
      schema_version: 1,
      normalizer_version: "catalog-v1",
      evidence: ref("observation_batch", 30),
      events: [
        event(100, 10, { type: "session_state_changed", state: "active" }),
        message(101, "user", 70),
        event(102, 10, {
          type: "tool_state_changed",
          tool_call_id: id(40),
          turn_id: id(80),
          state: "succeeded",
        }),
        event(103, 10, {
          type: "permission_observed",
          tool_call_id: id(41),
          state: "requested",
        }),
        event(104, 10, {
          type: "tool_state_changed",
          tool_call_id: id(41),
          turn_id: id(80),
          state: "running",
        }),
        message(105, "assistant", 71),
        message(106, "assistant", 72, 99),
        event(107, 10, {
          type: "capture_gap",
          missing_from: 11,
          missing_to: 13,
        }),
        event(108, 10, { type: "session_state_changed", state: "idle" }),
      ],
    }),
    ...tools,
    observation(30),
    record(
      "content",
      50,
      payload('{"path":"Notes/Projects/desktop-migration.md"}', "json"),
    ),
    record(
      "content",
      51,
      payload('{"task":"collect follow-up requirements"}', "json"),
    ),
    record(
      "content",
      60,
      payload(
        "# Desktop migration\n\n- [x] Local history\n- [ ] Native chat recovery\n",
      ),
    ),
    record(
      "content",
      70,
      payload(
        "Review yesterday's migration notes and identify the remaining work.",
      ),
    ),
    record("content", 71, payload(longAnswer)),
    record(
      "content",
      72,
      payload(
        "Foreign session message must never be attributed to this session.",
      ),
    ),
  ];
  const secondRecords = [
    record("event_batch", 21, {
      schema_version: 1,
      normalizer_version: "catalog-v1",
      evidence: ref("observation_batch", 31),
      events: [message(110, "assistant", 73, 11)],
    }),
    observation(31),
    record(
      "content",
      73,
      payload(
        "The earlier review is retained in its original linked session. No agent is running in this saved view.",
      ),
    ),
  ];
  const snapshot = {
    version: 2,
    conversation: owner,
    selection,
    references: {
      thread: ref("thread_version", 1),
      metadata: ref("conversation_metadata", 2),
      messages: { [id(3)]: ref("human_message_revision", 3) },
    },
    thread: {
      schema_version: 1,
      thread_id: owner.threadId,
      title: summary.title,
      status: "idle",
      actor: id(9),
      accepted_at_millis: summary.updatedAtMillis,
      previous: null,
      event: ref("thread_event", 4),
      baseline: null,
      purpose: { type: "conversation", target: owner.target },
    },
    metadata: {
      schema_version: 1,
      target: owner.target,
      thread_id: owner.threadId,
      value: {
        custom_title: summary.title,
        generated: {
          title: "Review the desktop migration",
          summary: "A local review of the remaining migration work.",
          keywords: ["migration", "recovery"],
          goals: ["Keep saved work recoverable"],
          sources: [{ session: id(10), snapshot: first.link.target.snapshot }],
          provider: "catalog",
          model: "fake-model",
          prompt_version: 1,
          generated_at_millis: "MAX_I64",
          truncated: false,
        },
        agent_titles: {},
      },
      actor: id(9),
      request_id: id(8),
      accepted_at_millis: summary.updatedAtMillis,
      previous: null,
    },
    messages: [
      {
        schema_version: 1,
        message_id: id(3),
        thread_id: owner.threadId,
        actor: id(9),
        accepted_at_millis: summary.createdAtMillis,
        previous: null,
        body: "Review yesterday's migration notes and identify the remaining work.",
      },
    ],
    sessions: [first, second],
  };
  return {
    snapshot: JSON.stringify(snapshot).replace(
      '"MAX_I64"',
      "9223372036854775807",
    ),
    pages: new Map([
      [
        firstCursor,
        JSON.stringify({
          version: 2,
          conversation: owner,
          selection,
          cursor: firstCursor,
          session_id: id(10),
          after_index: 0,
          next_after_index: null,
          records: firstRecords,
        }),
      ],
      [
        secondCursor,
        JSON.stringify({
          version: 2,
          conversation: owner,
          selection,
          cursor: secondCursor,
          session_id: id(11),
          after_index: 0,
          next_after_index: null,
          records: secondRecords,
        }),
      ],
    ]),
  };
}
export const catalogPage = (empty = false) =>
  JSON.stringify({
    version: 1,
    repository: owner.repository,
    selection,
    conversations: empty ? [] : [summary],
    nextCursor: null,
  });
