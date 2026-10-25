import type { App } from "@lapis-notes/api";
import type { NativeChatHost } from "@lapis-notes/app-profile/native-chat";
type Command = Parameters<NativeChatHost["call"]>[0];
type Value = Awaited<ReturnType<NativeChatHost["call"]>>;
type Record = NonNullable<Extract<Value, { kind: "record" }>["record"]>;
export function nativeTurnFixture(unknown = false) {
  const conversation = crypto.randomUUID();
  const records: Record[] = [];
  const calls: Command[] = [];
  let app: App | undefined;
  let leaves = 0;
  return {
    get app() {
      return app!;
    },
    records,
    calls,
    get leaves() {
      return leaves;
    },
    create(owner: App): NativeChatHost {
      app = owner;
      return {
        allowed: () => true,
        activate: async () => {},
        leave: async () => {
          leaves++;
        },
        async call(command): Promise<Value> {
          calls.push(structuredClone(command));
          if (command.kind === "set_enabled")
            return { kind: "availability", enabled: command.enabled };
          if (command.kind === "targets")
            return {
              kind: "targets",
              targets: [{ id: "codex", label: "Codex" }],
            };
          if (command.kind === "list")
            return {
              kind: "records",
              records: records.map((r) => ({
                request_id: r.input.request_id,
                conversation_id: r.conversation_id,
                target_id: r.input.target_id,
                scope_dir: r.input.scope_dir,
                phase: r.phase,
                accepted_at_ms: r.accepted_at_ms,
                updated_at_ms: r.updated_at_ms,
                failure_code: null,
              })),
            };
          if (command.kind === "read")
            return {
              kind: "record",
              record:
                records.find(
                  (r) => r.input.request_id === command.request_id,
                ) ?? null,
            };
          if (command.kind === "cancel")
            return { kind: "cancel_requested", accepted: false };
          const record: Record = {
            schema_version: 1,
            vault_id: crypto.randomUUID(),
            conversation_id: conversation,
            input: command.input,
            phase: "completed",
            accepted_at_ms: 1000 + records.length,
            updated_at_ms: 1000 + records.length,
            output: "A response persisted by the native service.",
            failure_code: null,
          };
          records.push(record);
          if (unknown) throw new Error("The native reply disconnected");
          return { kind: "record", record };
        },
        async readText(path) {
          if (path.endsWith("metadata.yaml"))
            return JSON.stringify({
              schemaVersion: 3,
              id: conversation,
              title: "Native conversation",
              status: "active",
            });
          return records
            .flatMap((r) => [
              {
                schemaVersion: 3,
                type: "message",
                id: r.input.request_id,
                role: "user",
                text: r.input.prompt,
              },
              {
                schemaVersion: 3,
                type: "message",
                id: r.input.request_id + ":reply",
                role: "assistant",
                text: r.output,
              },
            ])
            .map((r) => JSON.stringify(r))
            .join("\n");
        },
        report(error) {
          owner.notifications.notify({
            title: "AI",
            source: "ai",
            severity: "error",
            message: error.message,
          });
        },
      };
    },
  };
}
const fixtures = new WeakMap<Element, ReturnType<typeof nativeTurnFixture>>();
export function registerNativeTurns(
  element: Element,
  fixture: ReturnType<typeof nativeTurnFixture>,
) {
  fixtures.set(element, fixture);
  return () => fixtures.delete(element);
}
export function getNativeTurns(element: HTMLElement) {
  const fixture = fixtures.get(
    element.querySelector("[data-native-turn-review]")!,
  );
  if (!fixture) throw new Error("Native turn fixture unavailable");
  return fixture;
}
