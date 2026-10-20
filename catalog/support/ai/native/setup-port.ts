import { NativeConversationBackend } from "../../../../src/lib/native/ai/backends/client.ts";
import { id, uuid, owner, ref } from "./facts.ts";
import type {
  BackendSelection,
  BackendSelectionReceipt,
  PreparedConversation,
} from "../../../../src/lib/ai/conversations/backend-port.ts";

export type NativeSetupScenario =
  | "native"
  | "native-enabled"
  | "native-loading"
  | "native-failure"
  | "native-uncertain-choice"
  | "native-uncertain-creation"
  | "native-unavailable";
const reply = (type: string, data?: unknown) =>
  JSON.stringify({ version: 1, data: { type, data } });

/** Catalog simulation only: production framing/decoders, with no filesystem/provider. */
export function nativeSetupPort(scenario: NativeSetupScenario) {
  let selection: BackendSelection = {
    backend:
      scenario === "native-enabled" || scenario === "native-uncertain-creation"
        ? "jj"
        : "vault-files",
    revision:
      scenario === "native-enabled" || scenario === "native-uncertain-creation"
        ? 1
        : 0,
  };
  const receipts = new Map<string, BackendSelectionReceipt>();
  const created = new Map<string, PreparedConversation & { title: string }>();
  let finish!: () => void,
    stopped = false,
    readFailure = false,
    lostChoice = false,
    opened = false,
    reads = 0;
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const port = new NativeConversationBackend(
    "catalog-native-setup",
    async (text) => {
      const { operation: op } = JSON.parse(text);
      switch (op.type) {
        case "read":
          if (scenario === "native-loading" && !stopped) await waiting;
          if (scenario === "native-failure" && !readFailure) {
            readFailure = true;
            throw new Error("Catalog: native storage read unavailable");
          }
          return reply("selection", selection);
        case "select": {
          if (opened || op.expectedRevision !== selection.revision)
            throw new Error("Catalog: native storage is busy or changed");
          selection = { backend: op.backend, revision: selection.revision + 1 };
          const receipt = {
            request_id: op.requestId,
            expected_revision: op.expectedRevision,
            selection: structuredClone(selection),
          };
          receipts.set(op.requestId, receipt);
          if (scenario === "native-uncertain-choice" && !lostChoice) {
            lostChoice = true;
            throw new Error("Catalog: original choice reply lost");
          }
          return reply("receipt", receipt);
        }
        case "status":
          return reply("receipt", receipts.get(op.requestId) ?? null);
        case "open":
          if (selection.backend !== "jj")
            throw new Error("Catalog: native history has not been selected");
          opened = true;
          return reply("opened", { handle: uuid(1), selection });
        case "close":
          opened = false;
          return reply("closed");
        case "prepareConversation": {
          const value = {
            requestId: op.requestId,
            conversationId: uuid(100 + created.size),
            threadId: id(100 + created.size),
            repository: owner.repository,
            receipt: "catalog native receipt",
            title: op.title,
          };
          created.set(op.requestId, value);
          return reply(
            "conversation",
            scenario === "native-uncertain-creation"
              ? { ...value, receipt: null }
              : value,
          );
        }
        case "conversationStatus":
          return reply("conversation", created.get(op.requestId) ?? null);
        case "listConversations":
          return reply(
            "conversationCatalog",
            JSON.stringify({
              version: 1,
              repository: owner.repository,
              selection: [1],
              nextCursor: null,
              conversations: [...created.values()].map((value) => ({
                target: { type: "conversation", id: value.conversationId },
                threadId: value.threadId,
                repository: owner.repository,
                title: value.title,
                status: "created",
                createdAtMillis: 1792497600000,
                updatedAtMillis: 1792497600000,
              })),
            }),
          );
        case "openCanonicalConversationRead": {
          const value = [...created.values()].find(
            (entry) => entry.threadId === op.threadId,
          );
          if (!value) return reply("conversationRead", null);
          const target = { type: "conversation", id: value.conversationId };
          return reply("conversationRead", {
            handle: uuid(200 + ++reads),
            snapshot: JSON.stringify({
              version: 2,
              conversation: {
                target,
                threadId: value.threadId,
                repository: owner.repository,
              },
              selection: [1],
              references: {
                thread: ref("thread_version", 1),
                metadata: null,
                messages: {},
              },
              thread: {
                schema_version: 1,
                thread_id: value.threadId,
                title: value.title,
                status: "created",
                actor: id(9),
                accepted_at_millis: 1792497600000,
                previous: null,
                event: ref("thread_event", 2),
                baseline: null,
                purpose: { type: "conversation", target },
              },
              metadata: null,
              messages: [],
              sessions: [],
            }),
          });
        }
        case "closeConversationRead":
          return reply("closed");
        default:
          throw new Error(
            `Unexpected native setup fixture operation: ${op.type}`,
          );
      }
    },
  );
  return {
    port,
    finish: () => {
      stopped = true;
      finish();
    },
  };
}
