import type { App } from "@lapis-notes/api";
import type { AcpTransport } from "@lapismd/ai";
import { createNativeAi } from "../../../src/lib/native/ai/services.ts";
import type { NativeCall } from "../../../src/lib/native/vault-client.ts";

export function nativeNotesPorts() {
  let app: App | undefined;
  let allocations = 0;
  let factories = 0;
  const calls: { command: string; args: unknown }[] = [];
  const files = new Map<string, string>();
  const call: NativeCall = async <T>(command: string, args?: unknown) => {
    calls.push({ command, args });
    if (command === "desktop_ai_admit" || command === "desktop_ai_release")
      return undefined as T;
    if (command !== "desktop_ai_user_commands")
      throw new Error(`Unexpected AI port: ${command}`);
    const { operation } = args as {
      operation: { type: string; name: string; content: string };
    };
    switch (operation.type) {
      case "list":
        return {
          root: "/catalog/home/.lapis/agents/commands",
          files: [...files].map(([name, content]) => ({ name, content })),
        } as T;
      case "exists":
        return files.has(operation.name) as T;
      case "createIfMissing":
        if (files.has(operation.name)) return false as T;
        files.set(operation.name, operation.content);
        return true as T;
      case "write":
        files.set(operation.name, operation.content);
        return undefined as T;
      default:
        throw new Error("Unexpected AI command operation");
    }
  };
  return {
    get app() {
      return app;
    },
    get allocations() {
      return allocations;
    },
    get factories() {
      return factories;
    },
    calls,
    files,
    create(owner: App) {
      app = owner;
      factories++;
      return createNativeAi(
        owner,
        {
          profileId: "catalog",
          sessionId: "catalog-vault",
          name: "Catalog",
          path: "/catalog",
          resourceToken: "catalog",
        },
        {
          call,
          createTransport: () => {
            allocations++;
            return {
              targets: async () => [],
              list: async () => [],
            } as unknown as AcpTransport;
          },
        },
      );
    },
  };
}
type Ports = ReturnType<typeof nativeNotesPorts>;
const fixtures = new WeakMap<Element, Ports>();
export function registerNativeNotes(root: Element, ports: Ports) {
  fixtures.set(root, ports);
  return () => fixtures.delete(root);
}
export function nativeNotesFixture(canvas: Element): Ports {
  const root = canvas.querySelector("[data-native-notes-review]");
  const ports = root && fixtures.get(root);
  if (!ports) throw new Error("Native Notes review fixture is unavailable");
  return ports;
}
