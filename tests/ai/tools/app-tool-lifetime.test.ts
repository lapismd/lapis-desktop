import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { describe, expect, it, vi } from "vitest";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";
import type { AppToolCapture } from "../../../src/lib/ai/tools/app-tool-contracts.ts";

const settings = () => ({
  appToolsEnabled: true,
  disabledAppToolNames: [],
  enabledAppToolNames: [],
  enabledCommunityToolPluginIds: [],
});
const call = {
  runId: "run",
  toolCallId: "call",
  name: "test_lifetime",
  input: {},
};
function session(host: AppToolHost) {
  host.createSession({
    conversationId: "conversation",
    agentBindingId: "binding",
    scopeDir: "",
    runtimeSupportsAppTools: true,
  });
}

describe("application tool lifetime safety", () => {
  it("does not call a tool with a pre-cancelled invocation", async () => {
    const registry = new AppToolRegistry();
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "ok" }],
    }));
    registry.register(
      { pluginId: "ai", source: "official", provenance: "bundled" },
      {
        name: call.name,
        description: "Regression",
        inputSchema: { type: "object" },
        effect: "read",
        execute,
      },
    );
    const host = new AppToolHost(registry, settings);
    session(host);
    try {
      await expect(
        host.invoke("binding", call, AbortSignal.abort()),
      ).rejects.toMatchObject({ code: "cancelled" });
      expect(execute).not.toHaveBeenCalled();
    } finally {
      host.close();
    }
  });
  it("cancels a running invocation when its owner unregisters", async () => {
    const registry = new AppToolRegistry();
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let activeSignal: AbortSignal | undefined;
    const registration = registry.register(
      { pluginId: "ai", source: "official", provenance: "bundled" },
      {
        name: call.name,
        description: "Regression",
        inputSchema: { type: "object" },
        effect: "read",
        execute: async (_input, context) => {
          activeSignal = context.signal;
          entered();
          return new Promise((resolve) => {
            context.signal.addEventListener(
              "abort",
              () => resolve({ content: [] }),
              { once: true },
            );
          });
        },
      },
    );
    const host = new AppToolHost(registry, settings, 100);
    session(host);
    try {
      const pending = host.invoke("binding", call);
      await started;
      registration.dispose();
      expect(activeSignal?.aborted).toBe(true);
      await expect(pending).rejects.toMatchObject({ code: "tool_unavailable" });
    } finally {
      host.close();
    }
  });
  it("records an unknown mutating outcome if cancellation wins after dispatch", async () => {
    const registry = new AppToolRegistry();
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    registry.register(
      { pluginId: "ai", source: "official", provenance: "bundled" },
      {
        name: call.name,
        description: "Regression",
        inputSchema: { type: "object" },
        effect: "write",
        execute: async () => {
          entered();
          return new Promise(() => {});
        },
      },
    );
    const finish = vi.fn<AppToolCapture["finish"]>(async () => {});
    const host = new AppToolHost(registry, settings, 1000, {
      begin: async () => ({ spanId: "span" }),
      finish,
    });
    host.approvals.subscribe((request) => {
      host.approvals.respond(request.id, "allow-once");
    });
    session(host);
    const abort = new AbortController();
    try {
      const pending = host.invoke("binding", call, abort.signal);
      await started;
      abort.abort();
      await expect(pending).rejects.toMatchObject({ code: "cancelled" });
      expect(finish).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: "unknown" }),
      );
    } finally {
      host.close();
    }
  });
});
