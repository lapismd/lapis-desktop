import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import {
  parseAiTurn,
  type AiHistoryService,
  type AiUndoPreview,
} from "../../repository/ai-history.ts";

export function nativeAiHistory(
  sessionId: string,
  call: NativeCall,
): AiHistoryService {
  async function invoke(kind: string, data: unknown, expected: string) {
    try {
      const result = await call<{ kind: string; data: unknown }>(
        "desktop_ai_history",
        {
          request: { sessionId, action: { kind, data } },
        },
      );
      if (result?.kind !== expected)
        throw new Error("AI history returned a different response");
      return result.data;
    } catch (error) {
      throw nativeError(error);
    }
  }
  return {
    begin: async (context) =>
      parseAiTurn(await invoke("begin", context, "turn")),
    bind: async (context) => parseAiTurn(await invoke("bind", context, "turn")),
    end: async (conversation, turn, outcome) =>
      parseAiTurn(await invoke("end", { conversation, turn, outcome }, "turn")),
    read: async (conversation, turn) =>
      parseAiTurn(await invoke("read", { conversation, turn }, "turn")),
    async list(conversation, after) {
      const value = (await invoke(
        "list",
        { conversation, after: after ?? null },
        "page",
      )) as { records: unknown[]; next: string | null };
      if (
        !Array.isArray(value?.records) ||
        (value.next !== null && typeof value.next !== "string")
      )
        throw new Error("Invalid AI history page");
      return { records: value.records.map(parseAiTurn), next: value.next };
    },
    async previewUndo(conversation, turn, paths) {
      const value = (await invoke(
        "preview_undo",
        { conversation, turn, paths },
        "preview",
      )) as AiUndoPreview;
      if (
        !Array.isArray(value?.paths) ||
        !value.paths.every((p) => typeof p === "string") ||
        typeof value.expected !== "string"
      )
        throw new Error("Invalid AI undo preview");
      return value;
    },
    undo: (request) => invoke("undo", request, "capture"),
    pendingUndo: async () => {
      const value = await invoke("pending_undo", {}, "pending");
      if (!Array.isArray(value)) throw new Error("Invalid AI undo recovery");
      return value;
    },
  };
}
