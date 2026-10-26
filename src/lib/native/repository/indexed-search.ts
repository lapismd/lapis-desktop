import { nativeIndexedHistory } from "@lapis-notes/history/repository/controllers/native-indexed-search";
import type { HistoryIndexValue } from "@lapis-notes/api/native-history-index";
import type { NativeCall } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";

/** Bind the shared immutable History controls to the admitted native session. */
export function nativeIndexedSearch(sessionId: string, call: NativeCall) {
  return nativeIndexedHistory({
    async call(action) {
      try {
        return await call<HistoryIndexValue>("desktop_backup_history_search", {
          request: { sessionId, action },
        });
      } catch (error) {
        throw nativeError(error);
      }
    },
  });
}
