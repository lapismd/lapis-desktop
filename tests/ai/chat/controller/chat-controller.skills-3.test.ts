import { beforeAll, describe, expect, it, vi } from "vitest";
import { AppToolRegistry, type AppTool } from "@lapis-notes/api/agent-tools";
import { FakeAgentRuntime } from "../../support/fake-runtime.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
import {
  SkillRegistry,
  SkillSnapshotStore,
} from "../../../../src/lib/ai/skills/registry.ts";
import { SlashCommandCatalog } from "../../../../src/lib/ai/commands/catalog.ts";
import { SlashCommandRouter } from "../../../../src/lib/ai/commands/router.ts";
import { AppToolHost } from "../../../../src/lib/ai/tools/app-tool-host.ts";
import { createSkillAppTools } from "../../../../src/lib/ai/skills/skill-tools.ts";
import { BUNDLED_LAPIS_NOTES_SKILL } from "../../../../src/lib/ai/skills/bundled/lapis-notes.ts";
import { BUNDLED_RESEARCH_SKILL } from "../../../../src/lib/ai/skills/bundled/research.ts";
import { AiChatController } from "../../../../src/lib/ai/chat/chat-controller.svelte.ts";
import type {
  AgentRequest,
  AgentRuntime,
} from "../../../../src/lib/ai/core/runtime.ts";
import type { LoadedAppSkill } from "../../../../src/lib/ai/skills/types.ts";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;

beforeAll(async () => {
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
});

const RESEARCH = `---
name: research-notes
description: Research notes in the current folder
---
Use notes_search then read.
`;

const FIND = `---
name: find-notes
description: Find notes
command-dispatch: tool
command-tool: notes_search
---
Unused body.
`;

async function createSkillController(
  files: Record<string, string>,
  options: {
    native?: boolean;
    tool?: AppTool;
    bundled?: LoadedAppSkill[];
    extensions?: AppSlashCommandRegistry;
    workspace?: string;
    selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
    onComposerDefaults?: (next: {
      agent: string;
      runtimePreference: string;
    }) => void;
  } = {},
) {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  for (const [path, content] of Object.entries(files)) {
    await vault.mkpath(path.replace(/\/[^/]+$/u, ""));
    await vault.create(path, content);
  }
  const skills = new SkillRegistry({
    vault,
    bundled: options.bundled,
  });
  const skillSnapshots = new SkillSnapshotStore();
  const catalog = new SlashCommandCatalog(options.extensions);
  const slashRouter = new SlashCommandRouter(catalog, skills);
  const toolRegistry = new AppToolRegistry();
  if (options.tool) {
    toolRegistry.register(
      { pluginId: "search", source: "core", provenance: "bundled" },
      options.tool,
    );
  }
  for (const tool of createSkillAppTools({
    registry: skills,
    snapshots: skillSnapshots,
    vault,
  })) {
    toolRegistry.register(
      { pluginId: "ai", source: "core", provenance: "bundled" },
      tool,
    );
  }
  const appToolHost = new AppToolHost(toolRegistry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  const runtime = new FakeAgentRuntime({
    nativeCommands: options.native
      ? [{ name: "compact", description: "Compact the thread" }]
      : [],
  });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const conversationIds = [
    "123e4567-e89b-42d3-a456-426614174000",
    "223e4567-e89b-42d3-a456-426614174000",
  ];
  let conversationSeq = 0;
  const controller = new AiChatController(runtime, null, [], {
    repository,
    workspace: options.workspace,
    createConversation: (explicitFolder) => {
      const scopeDir = explicitFolder ?? "Projects";
      return {
        id: conversationIds[
          Math.min(conversationSeq++, conversationIds.length - 1)
        ]!,
        scopeDir,
        launchNotePath:
          scopeDir === "Projects" || scopeDir === ""
            ? "Projects/architecture.md"
            : undefined,
      };
    },
    skills,
    skillSnapshots,
    slashRouter,
    appToolHost,
    skillContext: () => ({
      scopeDir: "Projects",
      availableToolNames: ["notes_search"],
    }),
    readVaultText: async (path) => {
      const file = vault.getFileByPath(path);
      return file ? vault.cachedRead(file) : undefined;
    },
    request: {
      agent: "codex",
      model: { provider: "codex", model: "gpt-5.6" },
      metadata: { runtime: "acp" },
    },
    onComposerDefaults: options.onComposerDefaults,
    selectRuntime: options.selectRuntime,
  });
  return {
    controller,
    runtime,
    repository,
    skills,
    skillSnapshots,
    appToolHost,
  };
}

describe("AiChatController skills and slash commands", () => {
  it("lists /tools as a catalog inventory from the binding snapshot", async () => {
    const { controller, runtime } = await createSkillController(
      {},
      {
        tool: {
          name: "notes_search",
          description: "Search notes in the current scope.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false,
          },
          effect: "read",
          execute: async () => ({ content: [{ type: "text", text: "[]" }] }),
        },
      },
    );
    await controller.submit("/tools");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const notice = controller.items.find((item) => item.type === "status");
    expect(notice).toMatchObject({
      type: "status",
      layout: "inventory",
      inventory: {
        kind: "tools",
        items: expect.arrayContaining([
          expect.objectContaining({
            name: "notes_search",
            kind: "tool",
          }),
        ]),
      },
    });
    expect(notice?.type === "status" ? notice.text : "").toContain(
      "notes_search",
    );
    expect(runtime.sessions.at(-1)?.prompts ?? []).toEqual([]);
    await controller.close();
  });
});
