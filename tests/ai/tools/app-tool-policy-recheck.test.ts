import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { expect, it, vi } from "vitest";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";

function fixture(effect: "read" | "write") {
  const registry = new AppToolRegistry();
  const execute = vi.fn(async () => ({ content: [] }));
  registry.register(
    { pluginId: "ai", source: "official", provenance: "bundled" },
    {
      name: "test_policy",
      description: "Policy",
      inputSchema: { type: "object" },
      effect,
      execute,
    },
  );
  const settings = {
    appToolsEnabled: true,
    disabledAppToolNames: [] as string[],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  };
  const host = new AppToolHost(registry, () => settings);
  host.createSession({
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "",
    runtimeSupportsAppTools: true,
  });
  return {
    host,
    settings,
    execute,
    invoke: () =>
      host.invoke("binding", {
        name: "test_policy",
        input: {},
        runId: "turn",
        toolCallId: "call",
      }),
  };
}
it("rechecks enabled policy for an already captured snapshot", async () => {
  const f = fixture("read");
  f.settings.appToolsEnabled = false;
  try {
    await expect(f.invoke()).rejects.toMatchObject({
      code: "tool_unavailable",
    });
    expect(f.execute).not.toHaveBeenCalled();
  } finally {
    f.host.close();
  }
});
it("rechecks policy after an approval wait before dispatch", async () => {
  const f = fixture("write");
  f.host.approvals.subscribe((request) => {
    f.settings.disabledAppToolNames = ["test_policy"];
    f.host.approvals.respond(request.id, "allow-once");
  });
  try {
    await expect(f.invoke()).rejects.toMatchObject({
      code: "tool_unavailable",
    });
    expect(f.execute).not.toHaveBeenCalled();
  } finally {
    f.host.close();
  }
});
