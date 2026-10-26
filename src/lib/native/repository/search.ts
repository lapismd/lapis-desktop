import { searchPage } from "@lapis-notes/history/repository/controllers/search-page";
import type { NativeCall } from "../vault-client.ts";
import type { HistorySearchService } from "../../repository/search.ts";
import { nativeError } from "../native-error.ts";
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
