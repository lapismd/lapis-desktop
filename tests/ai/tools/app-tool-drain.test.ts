import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { expect, it } from "vitest";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";

it("retains an uncooperative callback after cancellation and allows retrying its drain", async () => {
  const registry = new AppToolRegistry();
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  let finish!: (value: { content: [] }) => void;
  const executing = new Promise<{ content: [] }>((resolve) => {
    finish = resolve;
  });
  registry.register(
    { pluginId: "ai", source: "official", provenance: "bundled" },
    {
      name: "test_drain",
      description: "Drain",
      inputSchema: { type: "object" },
      effect: "read",
      execute: () => {
        started();
        return executing;
      },
    },
  );
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  host.createSession({
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "",
    runtimeSupportsAppTools: true,
  });
  const invocation = host.invoke("binding", {
    name: "test_drain",
    input: {},
    runId: "turn",
    toolCallId: "call",
  });
  await entered;
  host.closeBinding("binding");
  await expect(invocation).rejects.toMatchObject({
    code: "cancelled",
    outcome: "unknown",
  });
  await expect(host.drainBinding("binding", 10)).rejects.toThrow(
    "outcome is unknown",
  );
  finish({ content: [] });
  await host.drainBinding("binding", 100);
  host.close();
});

it("marks callback failures after dispatch unknown while retaining the original reason", async () => {
  const registry = new AppToolRegistry();
  registry.register(
    { pluginId: "ai", source: "official", provenance: "bundled" },
    {
      name: "test_drain",
      description: "Drain",
      inputSchema: { type: "object" },
      effect: "read",
      execute: async () => {
        throw new Error("Effect may have started");
      },
    },
  );
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  host.createSession({
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "",
    runtimeSupportsAppTools: true,
  });
  await expect(
    host.invoke("binding", {
      name: "test_drain",
      input: {},
      runId: "turn",
      toolCallId: "call",
    }),
  ).rejects.toMatchObject({ code: "execution_failed", outcome: "unknown" });
  await host.drainBinding("binding");
  host.close();
});
