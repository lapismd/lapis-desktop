import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { describe, expect, it } from "vitest";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { CONVERSATION_SCHEMA_VERSION } from "../../../src/lib/ai/conversations/types.ts";
import { InMemoryMemoryRecordStore } from "../../../src/lib/ai/memory/memory-record-store.ts";
import { NativeMemoryService } from "../../../src/lib/ai/memory/native-memory-service.ts";
import { AI_MEMORY_EPISODIC_PROVIDER_ID } from "../../../src/lib/ai/memory/paths.ts";

const FIRST_CONVERSATION = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_CONVERSATION = "123e4567-e89b-42d3-a456-426614174001";

async function createConversation(
  repository: ConversationRepository,
  options: {
    id?: string;
    scopeDir?: string;
    text?: string;
    createdAt?: string;
  } = {},
) {
  const snapshot = await repository.create({
    id: options.id ?? FIRST_CONVERSATION,
    scopeDir: options.scopeDir ?? "Projects/Atlas",
    now: options.createdAt ?? "2026-08-20T09:00:00.000Z",
  });
  await repository.appendTranscript(snapshot.location, [
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "user-1",
      type: "message",
      role: "user",
      text:
        options.text ?? "Remember that project Atlas uses compact headings.",
      createdAt: options.createdAt ?? "2026-08-20T09:00:00.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "assistant-1",
      type: "message",
      role: "assistant",
      text: "I will preserve that project convention.",
      createdAt: "2026-08-20T09:00:01.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "tool-1",
      type: "tool",
      toolId: "call-1",
      name: "read",
      state: "completed",
      output: "Stored untrusted tool evidence",
      createdAt: "2026-08-20T09:00:02.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "system-1",
      type: "system.notice",
      text: "Injected recall must not be indexed",
      createdAt: "2026-08-20T09:00:03.000Z",
    },
  ]);
  return snapshot.location;
}

import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { AppToolHost } from "../../../src/lib/ai/tools/app-tool-host.ts";
import { createMemoryAppTools } from "../../../src/lib/ai/memory/memory-tools.ts";
describe("memory app tools", () => {
  it("freeze provider-independent descriptors and retain results across agent switches", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository);
    const database = new MemoryAppDatabase("memory-tools");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const registry = new AppToolRegistry();
    for (const tool of createMemoryAppTools(service)) {
      registry.register(
        { pluginId: "ai", source: "official", provenance: "bundled" },
        tool,
      );
    }
    const host = new AppToolHost(registry, () => ({
      appToolsEnabled: true,
      disabledAppToolNames: [],
      enabledAppToolNames: [],
      enabledCommunityToolPluginIds: [],
    }));
    for (const agentBindingId of ["codex-binding", "cursor-binding"]) {
      const descriptor = host.createSession({
        conversationId: FIRST_CONVERSATION,
        agentBindingId,
        scopeDir: "Projects/Atlas",
        runtimeSupportsAppTools: true,
      });
      expect(descriptor.tools.map((tool) => tool.name)).toEqual([
        "memory_get",
        "memory_search",
      ]);
    }

    const invokeSearch = (agentBindingId: string) =>
      host.invoke(agentBindingId, {
        runId: "run-1",
        toolCallId: `call-${agentBindingId}`,
        name: "memory_search",
        input: { query: "compact headings" },
      });
    const codex = await invokeSearch("codex-binding");
    const cursor = await invokeSearch("cursor-binding");
    expect(cursor.structuredContent).toEqual(codex.structuredContent);

    const searchOutput = codex.structuredContent as {
      results: Array<{ ref: string }>;
    };
    await expect(
      host.invoke("cursor-binding", {
        runId: "run-2",
        toolCallId: "call-get",
        name: "memory_get",
        input: { ref: searchOutput.results[0]!.ref },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        status: "available",
        evidenceMessages: [{ id: "user-1", verification: "matching" }],
      },
    });
  });
});
