import type {
  TranscriptBlock,
  TranscriptItem,
  TranscriptTool,
  TranscriptTurn,
} from "@lapismd/design-core/chat";
import { NativeSessionRecords } from "../conversations/native-session-records.ts";
import { nativeMessageContent } from "../conversations/native-message-content.ts";
import { nativeSessionAttribution } from "./native-session-attribution.ts";
import { nativeCreatedAt } from "./native-thread-projection.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";
import type { NativeConversationView } from "../conversations/native-view.ts";
import type {
  NativeAgentEvent,
  NativeRecordRef,
  NativeSessionRecordSource,
  NativeToolSnapshot,
} from "../conversations/native-records.ts";

function body(records: NativeSessionRecords, ref: NativeRecordRef) {
  const record = records.record(ref);
  if (record?.projection.type !== "content")
    throw new Error(
      "Native message content is unavailable in this pinned read",
    );
  return record.projection.value.payload;
}
function tool(
  records: NativeSessionRecords,
  source: NativeSessionRecordSource,
  value: NativeToolSnapshot,
  ref: NativeRecordRef,
  turn?: TranscriptTurn,
): TranscriptItem {
  const id = `native/session/${source.sessionId}/tool/${value.tool_call_id}`;
  const block = (ref: NativeRecordRef, field: string): TranscriptBlock => ({
    id: `${id}/${field}`,
    revision: ref.id,
    kind: "code",
    label: `Tool ${field}`,
    text: body(records, ref).text,
    commentable: false,
  });
  const display: TranscriptTool = {
    id,
    revision: ref.id,
    title:
      value.state === "succeeded"
        ? value.native_name
        : `${value.native_name} · ${value.state}`,
    status:
      value.state === "succeeded"
        ? "complete"
        : ["failed", "cancelled", "interrupted"].includes(value.state)
          ? "error"
          : "unknown",
    blocks: [
      ...(value.input ? [block(value.input, "input")] : []),
      ...(value.output ? [block(value.output, "output")] : []),
    ],
    raw: JSON.stringify(value, null, 2),
    commentable: false,
    detailPlacement: "sidebar",
  };
  return {
    id,
    kind: "tools",
    label: `${value.native_name} · ${value.state}`,
    turn,
    blocks: [],
    tools: [display],
  };
}
function status(event: NativeAgentEvent): string {
  switch (event.type) {
    case "session_state_changed":
      return `Recorded session state: ${event.state}`;
    case "tool_state_changed":
      return `Recorded tool ${event.tool_call_id.slice(0, 8)}: ${event.state}`;
    case "permission_observed":
      return `Recorded permission: ${event.state}`;
    case "file_observed":
      return `Observed file: ${event.path}`;
    case "capture_gap":
      return `Capture gap: ${event.missing_from}–${event.missing_to}`;
    case "message_completed":
      return "Recorded message";
  }
}
/** Render typed facts only. Evidence text is never replayed through an ACP parser. */
export function projectNativeSession(
  records: NativeSessionRecords,
  options: {
    conversation?: NativeConversationView;
    profiles?: readonly AgentRecipientOption[];
  } = {},
): TranscriptItem[] {
  if (!records.state.complete)
    throw new Error(
      "Load the pinned record closure before rendering this session",
    );
  const source = records.source,
    events: NativeAgentEvent[] = [],
    seen = new Map<string, string>(),
    evidence = new Map<string, NativeRecordRef>();
  for (const reference of source.eventBatches) {
    const record = records.record(reference);
    if (record?.projection.type !== "event_batch")
      throw new Error("Native event batch is unavailable");
    for (const event of record.projection.value.events) {
      if (event.session_id !== source.sessionId) continue;
      const exact = JSON.stringify(event, (_key, value: unknown) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
        previous = seen.get(event.event_id);
      if (previous !== undefined && previous !== exact)
        throw new Error(
          "Native event identity has conflicting retained values",
        );
      if (previous !== undefined) continue;
      seen.set(event.event_id, exact);
      evidence.set(event.event_id, record.projection.value.evidence);
      events.push(event);
    }
  }
  const turns = new Map<string, TranscriptTurn>();
  const attribution = nativeSessionAttribution(
    records,
    evidence.values(),
    options.profiles ?? [],
  );
  for (const event of events)
    if (
      event.type === "message_completed" &&
      event.role === "user" &&
      event.turn_id
    ) {
      const content = nativeMessageContent(
        body(records, event.content),
        source.integration,
      );
      turns.set(event.turn_id, {
        id: `native/session/${source.sessionId}/event/${event.event_id}`,
        author: "Captured user",
        prompt: content.text,
        summary: "",
      });
    }
  // Join only an explicit native revision association. Equal message text and
  // approximate timestamps never identify or merge contributions.
  for (const event of events) {
    const turnId = "turn_id" in event ? event.turn_id : null;
    const authored = attribution.authored(evidence.get(event.event_id));
    const human = authored
      ? options.conversation?.messages.find(
          (m) =>
            m.id === authored.messageId &&
            m.reference.id === authored.revision.id &&
            m.actor === authored.actor,
        )
      : undefined;
    if (turnId && human?.body)
      turns.set(turnId, {
        id: `native/thread/${human.threadId}/message/${human.id}`,
        author: `Author ${human.actor.slice(0, 8)}`,
        prompt: human.body,
        summary: "",
      });
  }
  const items: TranscriptItem[] = [],
    renderedTools = new Set<string>();
  for (const event of events) {
    const id = `native/session/${source.sessionId}/event/${event.event_id}`;
    if (event.type === "message_completed") {
      const content = nativeMessageContent(
          body(records, event.content),
          source.integration,
        ),
        isMessage = event.role === "user" || event.role === "assistant";
      items.push({
        id,
        kind: isMessage ? "message" : "context",
        role: isMessage ? (event.role as "user" | "assistant") : undefined,
        label: `Captured ${event.role} message`,
        turn: event.turn_id ? turns.get(event.turn_id) : undefined,
        author:
          event.role === "assistant" && attribution.assistant
            ? attribution.assistant
            : isMessage
              ? {
                  id:
                    event.role === "user"
                      ? `native/session/${source.sessionId}/captured-user`
                      : source.sessionId,
                  name:
                    event.role === "user"
                      ? "Captured user"
                      : source.integration === "owned_controller"
                        ? "Recorded agent"
                        : source.integration,
                  initials: event.role === "user" ? "CU" : "AI",
                }
              : undefined,
        sentContext: content.sentContext,
        blocks: [
          {
            id: `${id}/message/${event.message_id}`,
            revision: event.content.id,
            kind: content.kind,
            label: `Captured ${event.role} message`,
            text: content.text,
            commentable: false,
          },
        ],
      });
      continue;
    }
    if (event.type === "tool_state_changed") {
      if (renderedTools.has(event.tool_call_id)) continue;
      const ref = source.tools[event.tool_call_id],
        record = ref ? records.record(ref) : undefined;
      if (ref && record?.projection.type === "tool_snapshot") {
        items.push(
          tool(
            records,
            source,
            record.projection.value,
            ref,
            record.projection.value.turn_id
              ? turns.get(record.projection.value.turn_id)
              : undefined,
          ),
        );
        renderedTools.add(event.tool_call_id);
        continue;
      }
    }
    items.push({
      id,
      kind: "context",
      label: status(event),
      createdAt: nativeCreatedAt(source.linkedAtMillis),
      notice: event.type === "capture_gap" ? "warning" : undefined,
      blocks: [],
    });
  }
  for (const [id, ref] of Object.entries(source.tools)) {
    if (renderedTools.has(id)) continue;
    const record = records.record(ref);
    if (record?.projection.type !== "tool_snapshot")
      throw new Error("Native tool snapshot is unavailable");
    items.push(tool(records, source, record.projection.value, ref));
  }
  return items;
}
