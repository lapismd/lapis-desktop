import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { vi } from "vitest";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";
import { NativeAppTools } from "../../../src/lib/native/ai/app-tools/coordinator.ts";
import type {
  NativeToolEvent,
  Operation,
  ToolPort,
} from "../../../src/lib/native/ai/app-tools/types.ts";

export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
export function fixture(
  effect: "read" | "write" = "read",
  execute = vi.fn(async () => ({ content: [] })),
) {
  const registry = new AppToolRegistry();
  registry.register(
    { pluginId: "notes", source: "core", provenance: "bundled" },
    {
      name: "notes_read",
      description: "Read an admitted note",
      inputSchema: { type: "object" },
      effect,
      execute,
    },
  );
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  let listener!: (event: NativeToolEvent) => void;
  const request = vi.fn(async (_id: string, _operation: Operation) => {});
  const report = vi.fn();
  const work = vi.fn(async <T>(_title: string, task: () => Promise<T>) =>
    task(),
  );
  const port: ToolPort = {
    prepare: vi.fn(async () => {}),
    listen: vi.fn(async (receive) => {
      listener = receive;
      return vi.fn();
    }),
    request,
    report,
    work,
  };
  const bridge = new NativeAppTools(host, port);
  const input = {
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "Notes",
    runtimeSupportsAppTools: true,
  };
  return {
    bridge,
    host,
    port,
    request,
    report,
    work,
    execute,
    input,
    event: (event: NativeToolEvent) => listener(event),
    replies: () =>
      request.mock.calls.filter((call) => call[1].type === "reply"),
  };
}
