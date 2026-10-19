import type { NativeCall } from "../vault-client.ts";
import type {
  HistorySearchPage,
  HistorySearchService,
} from "../../repository/search.ts";
import { nativeError } from "../native-error.ts";
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";
const id = (value: unknown, length: number) =>
  typeof value === "string" && new RegExp(`^[0-9a-f]{${length}}$`).test(value);
export function searchPage(value: unknown): HistorySearchPage {
  if (
    !object(value) ||
    !Array.isArray(value.hits) ||
    value.hits.length > 9 ||
    !Number.isSafeInteger(value.checkpoints) ||
    !Number.isSafeInteger(value.unindexed)
  )
    throw new Error("Invalid history search response");
  for (const hit of value.hits) {
    const revision = object(hit) && hit.revision;
    const checkpoint = object(revision) && revision.checkpoint;
    if (
      !object(hit) ||
      !object(revision) ||
      !object(checkpoint) ||
      !id(checkpoint.commit, 40) ||
      !id(checkpoint.operation, 128) ||
      !id(checkpoint.change_id, 32) ||
      typeof checkpoint.description !== "string" ||
      !Number.isSafeInteger(checkpoint.timestamp_millis) ||
      typeof revision.author !== "string" ||
      typeof revision.email !== "string" ||
      typeof hit.excerpt !== "string" ||
      (hit.path != null &&
        (typeof hit.path !== "string" ||
          hit.path
            .split("/")
            .some((p: string) =>
              ["", ".", "..", ".jj", ".git", ".lapis"].includes(p),
            )))
    )
      throw new Error("Invalid history search hit");
  }
  if (
    value.next != null &&
    (!object(value.next) ||
      !id(value.next.anchor, 40) ||
      !Number.isSafeInteger(value.next.revision) ||
      (value.next.after_path != null &&
        typeof value.next.after_path !== "string"))
  )
    throw new Error("Invalid history search cursor");
  return value as HistorySearchPage;
}
export function nativeSearch(
  sessionId: string,
  call: NativeCall,
): HistorySearchService {
  return {
    async page({ query, cursor }) {
      try {
        return searchPage(
          await call("desktop_backup_search", {
            request: {
              sessionId,
              search: {
                query: {
                  text: query.text,
                  path: query.path,
                  author: query.author,
                  from_millis: query.from_millis,
                  to_millis: query.to_millis,
                },
                cursor: cursor
                  ? {
                      anchor: cursor.anchor,
                      revision: cursor.revision,
                      after_path: cursor.after_path,
                    }
                  : null,
              },
            },
          }),
        );
      } catch (error) {
        throw nativeError(error);
      }
    },
  };
}
