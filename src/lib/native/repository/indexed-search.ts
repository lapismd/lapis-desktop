import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import type {
  HistoryIndexStatus,
  IndexedHistoryPage,
  IndexedHistoryService,
  HistoryMatchContext,
} from "../../repository/indexed-search.ts";
import { searchPage } from "./search.ts";

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";
const count = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) >= 0;
const commit = (value: unknown) =>
  typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
export function indexStatus(value: unknown): HistoryIndexStatus {
  if (
    !object(value) ||
    !count(value.generation) ||
    !count(value.indexed) ||
    !count(value.omitted) ||
    typeof value.complete !== "boolean"
  )
    throw new Error("Invalid history index status");
  return value as HistoryIndexStatus;
}
export function indexedPage(value: unknown): IndexedHistoryPage {
  if (
    !object(value) ||
    !Array.isArray(value.hits) ||
    value.hits.length > 100 ||
    typeof value.reset !== "boolean" ||
    (value.next != null &&
      (typeof value.next !== "string" || value.next.length > 512))
  )
    throw new Error("Invalid indexed history response");
  indexStatus(value.status);
  for (const hit of value.hits) {
    if (!object(hit) || !object(hit.record))
      throw new Error("Invalid indexed history hit");
    const record = hit.record;
    searchPage({
      hits: [
        {
          revision: record.revision,
          path: record.path,
          excerpt: hit.excerpt,
          line: hit.line,
        },
      ],
      checkpoints: 0,
      unindexed: 0,
    });
    if (
      !Array.isArray(record.parents) ||
      record.parents.length > 1024 ||
      !record.parents.every(commit) ||
      typeof record.deleted !== "boolean" ||
      typeof record.unavailable !== "boolean" ||
      (record.previous != null && !commit(record.previous)) ||
      (record.content_id != null &&
        (typeof record.content_id !== "string" ||
          !/^[0-9a-f]{40,128}$/.test(record.content_id))) ||
      (hit.line != null && (!count(hit.line) || Number(hit.line) < 1))
    )
      throw new Error("Invalid indexed version reference");
  }
  return value as IndexedHistoryPage;
}
function matchContext(value: unknown): HistoryMatchContext {
  if (
    !object(value) ||
    typeof value.text !== "string" ||
    value.text.length > 32768 ||
    !count(value.start) ||
    !count(value.end) ||
    Number(value.end) < Number(value.start) ||
    typeof value.before !== "boolean" ||
    typeof value.after !== "boolean"
  )
    throw new Error("Invalid saved match context");
  return value as HistoryMatchContext;
}
export function nativeIndexedSearch(
  sessionId: string,
  call: NativeCall,
): IndexedHistoryService {
  const action = async (value: Record<string, unknown>) => {
    try {
      return await call("desktop_backup_history_search", {
        request: { sessionId, action: value },
      });
    } catch (error) {
      throw nativeError(error);
    }
  };
  return {
    start: async () => indexStatus(await action({ kind: "start" })),
    status: async () => indexStatus(await action({ kind: "status" })),
    query: async (search) =>
      indexedPage(await action({ kind: "query", search })),
    context: async (request) =>
      matchContext(await action({ kind: "context", ...request })),
  };
}
