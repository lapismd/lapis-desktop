import { NativeConversationBackend } from "../../../../src/lib/native/ai/backends/client.ts";
import { catalogPage, nativeData } from "./data.ts";
import { owner, uuid } from "./facts.ts";
import { managedNativeData } from "./managed-data.ts";
export type NativeReaderScenario =
  | "authored"
  | "captured"
  | "managed"
  | "loading"
  | "empty"
  | "failure"
  | "read-failure";
const reply = (type: string, data?: unknown) =>
  JSON.stringify({ version: 1, data: { type, data } });
export function nativeReaderPort(scenario: NativeReaderScenario) {
  let attempt = 0,
    reads = 0,
    failedRead = false,
    closing = false;
  const pending = new Set<() => void>();
  const snapshots = new Map<string, ReturnType<typeof nativeData>>();
  const port = new NativeConversationBackend(
    "catalog-native-vault",
    async (request) => {
      const { operation } = JSON.parse(request);
      switch (operation.type) {
        case "read":
          return reply("selection", { backend: "jj", revision: 1 });
        case "open":
          return reply("opened", {
            handle: uuid(1),
            selection: { backend: "jj", revision: 1 },
          });
        case "close":
          return reply("closed");
        case "listConversations":
          if (scenario === "failure" && attempt++ === 0)
            throw new Error(
              "Catalog fixture: native source temporarily unavailable",
            );
          if (scenario === "loading" && !closing)
            await new Promise<void>((resolve) => pending.add(resolve));
          return reply(
            "conversationCatalog",
            catalogPage(scenario === "empty" || closing),
          );
        case "openCanonicalConversationRead": {
          if (operation.threadId !== owner.threadId)
            return reply("conversationRead", null);
          const source = nativeData(++reads),
            data = scenario === "managed" ? managedNativeData(source) : source,
            handle = uuid(200 + reads);
          snapshots.set(handle, data);
          return reply("conversationRead", { handle, snapshot: data.snapshot });
        }
        case "readConversationRecords": {
          if (scenario === "read-failure" && !failedRead) {
            failedRead = true;
            throw new Error(
              "Catalog fixture: record read failed; the original pin is retained",
            );
          }
          const page = snapshots
            .get(operation.readHandle)
            ?.pages.get(operation.cursor);
          if (!page || operation.afterIndex !== 0)
            throw new Error("Invalid catalog record cursor");
          return reply("conversationRecords", page);
        }
        case "closeConversationRead":
          snapshots.delete(operation.readHandle);
          return reply("closed");
        default:
          throw new Error(`Unexpected catalog operation ${operation.type}`);
      }
    },
  );
  return {
    port,
    opened: {
      handle: uuid(1),
      selection: { backend: "jj" as const, revision: 1 },
    },
    finish: () => {
      closing = true;
      for (const resolve of pending) resolve();
      pending.clear();
    },
  };
}
