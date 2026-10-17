import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { describe, expect, it, vi } from "vitest";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";

function fixture(
  inputSchema: Record<string, unknown>,
  outputSchema?: Record<string, unknown>,
) {
  const registry = new AppToolRegistry();
  const execute = vi.fn(async () => ({
    content: [{ type: "text" as const, text: "ok" }],
    structuredContent: { count: "invalid" },
  }));
  registry.register(
    { pluginId: "ai", source: "official", provenance: "bundled" },
    {
      name: "test_schema",
      description: "Schema regression",
      inputSchema,
      outputSchema,
      effect: "read",
      execute,
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
  const invoke = (input: unknown = {}) =>
    host.invoke("binding", {
      runId: "run",
      toolCallId: "call",
      name: "test_schema",
      input,
    });
  return { host, execute, invoke };
}

describe("app tool schema admission", () => {
  it.each([
    { type: "object", properties: { path: { type: "invalid-type" } } },
    { type: "object", required: "path" },
    { type: "object", properties: { path: 7 } },
    { type: "object", properties: { path: { type: "string", minLength: -1 } } },
    { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object" },
    {
      type: "object",
      properties: { optional: { $ref: "https://missing.invalid/schema" } },
    },
  ])(
    "rejects an invalid or unavailable schema before execution: %j",
    async (inputSchema) => {
      const { host, execute, invoke } = fixture(inputSchema);
      try {
        await expect(invoke()).rejects.toMatchObject({
          code: "invalid_tool_schema",
        });
        expect(execute).not.toHaveBeenCalled();
      } finally {
        host.close();
      }
    },
  );
  it("accepts frozen schemas and inline references without changing the registration", async () => {
    const inputSchema = Object.freeze({
      type: "object",
      definitions: Object.freeze({
        name: Object.freeze({ type: "string", minLength: 2 }),
      }),
      properties: Object.freeze({
        name: Object.freeze({ $ref: "#/definitions/name" }),
      }),
      required: Object.freeze(["name"]),
      additionalProperties: false,
    });
    const before = JSON.stringify(inputSchema);
    const { host, execute, invoke } = fixture(inputSchema);
    try {
      await expect(invoke({ name: "Atlas" })).resolves.toMatchObject({
        content: [{ text: "ok" }],
      });
      await expect(invoke({ name: 7 })).rejects.toMatchObject({
        code: "invalid_arguments",
      });
      expect(execute).toHaveBeenCalledOnce();
      expect(JSON.stringify(inputSchema)).toBe(before);
    } finally {
      host.close();
    }
  });
  it("validates structured results against the declared output schema", async () => {
    const { host, invoke } = fixture(
      { type: "object" },
      {
        type: "object",
        properties: { count: { type: "integer" } },
        required: ["count"],
      },
    );
    try {
      await expect(invoke()).rejects.toMatchObject({ code: "invalid_result" });
    } finally {
      host.close();
    }
  });
});
