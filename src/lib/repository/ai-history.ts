import type { App } from "@lapis-notes/api";
import type { BackupCheckpoint } from "./backup.ts";
import type { HistoryReader } from "./history-reader.ts";

export type AiTurnContext = {
  conversation: string;
  turn: string;
  message: string | null;
  binding: string | null;
  session: string | null;
  agent: string;
  harness: string;
  requested_model: string | null;
  resolved_model: string | null;
};
export type AiTurnOutcome = "completed" | "failed" | "cancelled" | "unknown";
export type AiTurnRecord = {
  version: 1;
  context: AiTurnContext;
  started_at: number;
  ended_at: number | null;
  phase: "running" | "complete" | "incomplete";
  outcome: AiTurnOutcome | null;
  before: BackupCheckpoint;
  after: BackupCheckpoint | null;
};
export type AiUndoPreview = { paths: string[]; expected: string };
export type AiUndoRequest = AiUndoPreview & {
  request_id: string;
  conversation: string;
  turn: string;
};
export interface AiHistoryService {
  begin(context: AiTurnContext): Promise<AiTurnRecord>;
  bind(context: AiTurnContext): Promise<AiTurnRecord>;
  end(
    conversation: string,
    turn: string,
    outcome: AiTurnOutcome,
  ): Promise<AiTurnRecord>;
  list(
    conversation: string,
    after?: string,
  ): Promise<{ records: AiTurnRecord[]; next: string | null }>;
  read(conversation: string, turn: string): Promise<AiTurnRecord>;
  previewUndo(
    conversation: string,
    turn: string,
    paths: string[],
  ): Promise<AiUndoPreview>;
  undo(request: AiUndoRequest): Promise<unknown>;
  pendingUndo(): Promise<AiUndoRequest[]>;
}
export type AiHistoryBinding = {
  service: AiHistoryService;
  reader: HistoryReader;
  enabled(): boolean;
  guard<T>(action: () => Promise<T>): Promise<T>;
  reveal(record: AiTurnRecord): Promise<void>;
};
const bindings = new WeakMap<App, AiHistoryBinding>();
export function bindAiHistory(app: App, binding: AiHistoryBinding): () => void {
  if (bindings.has(app)) throw new Error("AI history is already bound");
  bindings.set(app, binding);
  return () => {
    if (bindings.get(app) === binding) bindings.delete(app);
  };
}
export const ownedAiHistory = (app?: App) =>
  app ? bindings.get(app) : undefined;

export function parseAiTurn(value: unknown): AiTurnRecord {
  const row = value as AiTurnRecord;
  const checkpoint = (p: BackupCheckpoint | null) =>
    p &&
    /^[0-9a-f]{40,128}$/u.test(p.commit) &&
    /^[0-9a-f]{40,128}$/u.test(p.operation) &&
    typeof p.description === "string" &&
    Number.isSafeInteger(p.timestamp_millis);
  if (
    !row ||
    row.version !== 1 ||
    !row.context ||
    !["running", "complete", "incomplete"].includes(row.phase) ||
    !Number.isSafeInteger(row.started_at) ||
    (row.ended_at !== null && !Number.isSafeInteger(row.ended_at)) ||
    (row.outcome !== null &&
      !["completed", "failed", "cancelled", "unknown"].includes(row.outcome)) ||
    (row.phase === "complete" &&
      (!row.after || !row.outcome || row.outcome === "unknown")) ||
    !checkpoint(row.before) ||
    (row.after !== null && !checkpoint(row.after))
  )
    throw new Error("Invalid AI history record");
  for (const id of [row.context.conversation, row.context.turn])
    if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,128}$/u.test(id))
      throw new Error("Invalid AI history identity");
  for (const text of [
    row.context.agent,
    row.context.harness,
    row.context.message,
    row.context.binding,
    row.context.session,
    row.context.requested_model,
    row.context.resolved_model,
  ])
    if (
      text !== null &&
      (typeof text !== "string" ||
        !text.length ||
        text.length > 256 ||
        /[\u0000-\u001f\u007f]/u.test(text))
    )
      throw new Error("Invalid AI history context");
  return row;
}
