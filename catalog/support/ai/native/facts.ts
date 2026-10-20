// Catalog-only typed native wire fixtures. No provider, credential or executable.
export const id = (n: number) => n.toString(16).padStart(32, "0");
export const uuid = (n: number) =>
  `${n.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
export const ref = (kind: string, n: number) => ({
  kind,
  id: n.toString(16).padStart(64, "0"),
});
export const owner = {
  target: { type: "conversation", id: "catalog:project-note-review" },
  threadId: id(1),
  repository: id(2),
};
export const summary = {
  ...owner,
  title: "Review yesterday's project notes",
  status: "idle",
  createdAtMillis: Date.parse("2026-10-19T09:10:00Z"),
  updatedAtMillis: Date.parse("2026-10-20T09:30:00Z"),
};
export const selection = [42, 7, 255];
export const payload = (text: string, media_type = "text") => ({
  schema_version: 1,
  payload: { media_type, text },
});
export const record = <T>(kind: string, n: number, value: T) => ({
  reference: ref(kind, n),
  projection: { type: kind, value },
});
export const event = <T extends object>(
  n: number,
  session: number,
  fields: T,
) => ({
  event_id: id(n),
  session_id: id(session),
  ...fields,
});
export function observation(n: number) {
  return record("observation_batch", n, {
    schema_version: 1,
    batch_id: id(n),
    integration: "owned_controller",
    source_instance_id: id(n + 1),
    sanitizer_version: "catalog-sanitized-v1",
    representation: "sanitized_native",
    observations: [
      {
        observation_id: id(n + 2),
        source_sequence: 1,
        occurred_at_millis: null,
        source_kind: "manual",
        source_trust: "untrusted_assertion",
        payload: { media_type: "text", text: "Sanitized catalog observation" },
      },
    ],
  });
}
export function linkedSession(
  session: number,
  cursor: string,
  batch: number,
  evidence: number,
  tools: Record<string, ReturnType<typeof ref>>,
  partial = false,
) {
  return {
    records_cursor: cursor,
    link: {
      schema_version: 1,
      id: id(session + 100),
      thread_id: owner.threadId,
      actor: id(9),
      accepted_at_millis: summary.updatedAtMillis,
      previous: null,
      active: true,
      target: {
        type: "session",
        session_id: id(session),
        snapshot: ref("session_snapshot", session + 200),
        primary: true,
      },
    },
    snapshot: {
      schema_version: 1,
      session_id: id(session),
      integration: "owned_controller",
      state: "idle",
      parent_session_id: null,
      evidence: [ref("observation_batch", evidence)],
      event_batches: [ref("event_batch", batch)],
      transcripts: [],
      tools,
      coverage: {
        completeness: partial ? "partial" : "complete",
        gaps: partial ? 1 : 0,
        redacted_fields: partial ? 2 : 0,
        truncated: false,
      },
    },
    transcripts: [],
  };
}
export const longAnswer = [
  "## Review of the migration notes\n\nThe local notes retain **their own history** and remain usable offline. The next steps are:",
  "- Keep native read selections pinned.\n- Preserve unresolved work after restart.\n- Review tool output before changing a note.",
  ...Array.from(
    { length: 12 },
    (_, i) =>
      `### ${i + 1}. ${["Context and ownership", "Failure recovery", "Local notes", "Follow-up work"][i % 4]}\n\nThe review checks the recorded source before making a recommendation. This paragraph exercises wrapping beside the conversation list and both workspace sidebars.\n\n\`Notes/Projects/desktop-migration/long-lived-session-recovery-and-pinned-history-review.md\` remains a captured path, with no current file read.`,
  ),
  "```ts\nconst recovery = await history.openPinned(selection);\nawait recovery.readSavedMessages();\n```",
].join("\n\n");
