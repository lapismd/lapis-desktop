import type { App } from "@lapis-notes/api";
import type { NativeChatHost } from "@lapis-notes/app-profile/native-chat";
import type {
  QueueCommand,
  QueueRecord,
  QueueValue,
} from "@lapis-notes/api/native-turns";
import { nativeTurnFixture } from "../native-turns/fixture";

export type QueueScenario =
  | "running"
  | "uncertain"
  | "refused"
  | "unavailable"
  | "loading";
const declaration = {
  recipient: {
    id: "codex",
    label: "Codex",
    token: "jj-store-agent:636f646578;",
  },
  target: { id: "codex", agent: "codex" as const },
};

/** Disposable service replies; the real shared observer owns all presentation. */
export function nativeQueueFixture(scenario: QueueScenario = "running") {
  const turns = nativeTurnFixture();
  const calls: QueueCommand[] = [];
  let saved: QueueRecord | null = null;
  let releaseObservation!: () => void;
  const observation = new Promise<void>((resolve) => {
    releaseObservation = resolve;
  });
  return {
    turns,
    calls,
    releaseObservation: () => releaseObservation(),
    get app() {
      return turns.app;
    },
    get queue() {
      return saved;
    },
    create(app: App): NativeChatHost {
      const host = turns.create(app);
      const original = host.call;
      return {
        ...host,
        async call(command) {
          const value = await original(command);
          if (scenario === "loading" && command.kind === "targets")
            await observation;
          if (value.kind === "targets" && scenario !== "unavailable")
            for (const target of value.targets)
              target.queue_selection = declaration;
          if (
            command.kind === "submit" &&
            value.kind === "record" &&
            value.record
          ) {
            value.record.phase = "running";
            value.record.output = "";
          }
          if (command.kind === "cancel" && value.kind === "cancel_requested") {
            const record = turns.records.find(
              (row) => row.input.request_id === command.request_id,
            );
            if (record) {
              record.phase = "cancelled";
              value.accepted = true;
            }
          }
          return value;
        },
        queue: {
          selection: async () =>
            scenario === "unavailable"
              ? undefined
              : structuredClone(declaration),
          async call(command): Promise<QueueValue> {
            calls.push(structuredClone(command));
            if (command.kind === "accept") {
              if (scenario === "refused")
                throw Object.assign(
                  new Error("The native target refused this queued message"),
                  { code: "EACCES" },
                );
              saved ??= {
                schema_version: 1,
                vault_id: turns.records[0].vault_id,
                conversation_id: command.input.conversation_id,
                scope_dir: command.input.scope_dir,
                head_request_id: command.input.after_request_id,
                paused: false,
                barrier: null,
                entries: [],
              };
              saved.entries.push({
                input: structuredClone(command.input),
                request_id: crypto.randomUUID(),
                phase: "pending",
                receipt: null,
                receipt_published: false,
              });
              if (scenario === "uncertain")
                throw new Error("The native acknowledgement disconnected");
            } else if (command.kind === "stop" && saved) {
              saved.paused = true;
              turns.records[0].phase = "cancelled";
            } else if (command.kind === "resume" && saved) {
              saved.paused = false;
            } else if (command.kind === "cancel" && saved) {
              const entry = saved.entries.find(
                (row) => row.input.acceptance_id === command.acceptance_id,
              );
              if (entry?.phase === "pending") entry.phase = "cancelled";
            }
            return { kind: "queue", queue: structuredClone(saved) };
          },
        },
      };
    },
  };
}
const fixtures = new WeakMap<Element, ReturnType<typeof nativeQueueFixture>>();
export function registerNativeQueue(
  element: Element,
  fixture: ReturnType<typeof nativeQueueFixture>,
) {
  fixtures.set(element, fixture);
  return () => fixtures.delete(element);
}
export function getNativeQueue(element: HTMLElement) {
  const fixture = fixtures.get(
    element.querySelector("[data-native-queue-review]")!,
  );
  if (!fixture) throw new Error("Native queue fixture unavailable");
  return fixture;
}
