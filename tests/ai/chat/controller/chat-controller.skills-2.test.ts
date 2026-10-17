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
  it("lists /help locally in App, Actions, Skills, and Current Agent groups", async () => {
    const extensions = new AppSlashCommandRegistry();
    extensions.register(
      { pluginId: "search" },
      {
        name: "search",
        description: "Search notes",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
    );
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.agents/skills/research-notes/SKILL.md": RESEARCH,
      },
      { native: true, extensions },
    );
    await controller.submit("hello");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const bindingBeforeHelp = controller.activeBindingId;
    await controller.submit("/help");
    expect(controller.activeBindingId).toBe(bindingBeforeHelp);
    expect(runtime.sessions).toHaveLength(1);
    const notice = controller.items.find((item) => item.type === "status");
    expect(notice).toMatchObject({ type: "status", layout: "report" });
    expect(notice?.text).toContain("App");
    expect(notice?.text).toContain("/help");
    expect(notice?.text).toContain("Actions");
    expect(notice?.text).toContain("/search");
    expect(notice?.text).toContain("Skills");
    expect(notice?.text).toContain("/research-notes");
    expect(notice?.text).toContain("Current Agent · Codex ACP");
    expect(notice?.text).toContain("/native compact");
    expect(runtime.sessions[0]?.prompts ?? []).toEqual(["hello"]);
    await controller.submit("/commands");
    expect(
      controller.items.filter((item) => item.type === "status").length,
    ).toBeGreaterThan(1);
    await controller.close();
  });

  it("reports /scope and starts a new conversation for a folder argument", async () => {
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.agents/skills/research-notes/SKILL.md": RESEARCH,
      },
      { workspace: "/Users/test/vault" },
    );
    await controller.submit("hello");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    const firstId = controller.location?.conversationId;
    expect(firstId).toBe("123e4567-e89b-42d3-a456-426614174000");
    await controller.submit("/scope");
    expect(
      controller.items.some(
        (item) =>
          item.type === "status" &&
          item.text.includes("Scope: Projects") &&
          item.text.includes("Source: conversation"),
      ),
    ).toBe(true);
    await controller.submit("/scope Notes");
    expect(controller.location?.scopeDir).toBe("Notes");
    expect(controller.location?.conversationId).toBe(
      "223e4567-e89b-42d3-a456-426614174000",
    );
    expect(controller.location?.conversationId).not.toBe(firstId);
    expect(
      controller.items.some(
        (item) => item.type === "status" && item.text.includes("Scope: Notes"),
      ),
    ).toBe(true);
    expect(runtime.lastRequest?.prompt ?? "").not.toContain("/scope");
    await controller.close();
  });

  it("reports /context and /status locally", async () => {
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.agents/skills/research-notes/SKILL.md": RESEARCH,
        "Projects/.lapis/AGENTS.md": "Prefer notes under architecture/.",
      },
      { workspace: "lapis-code" },
    );
    await controller.submit("/context");
    const notice = controller.items.find((item) => item.type === "status");
    expect(notice).toMatchObject({ type: "status", layout: "report" });
    expect(notice?.text).toContain("\n");
    expect(notice?.text).toContain("Conversation:");
    expect(notice?.text).toContain("Scope: Projects");
    expect(notice?.text).toContain("Agent: Codex ACP");
    expect(notice?.text).toContain("Model: gpt-5.6");
    expect(notice?.text).toContain("research-notes");
    expect(notice?.text).toContain(
      "Folder instructions: Projects/.lapis/AGENTS.md",
    );
    expect(notice?.text).toContain("No bootstrap truncation");
    expect(notice?.text).not.toContain("/Users/");
    expect(runtime.sessions.at(-1)?.prompts ?? []).toEqual([]);
    await controller.submit("/status");
    expect(
      controller.items.filter(
        (item) => item.type === "status" && item.text.includes("Conversation:"),
      ).length,
    ).toBeGreaterThan(1);
    await controller.close();
  });

  it("marks busy while /status prepares its local notice", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { controller, runtime } = await createSkillController(
      {
        "Projects/.agents/skills/research-notes/SKILL.md": RESEARCH,
      },
      {
        selectRuntime: async () => {
          await gate;
          return runtime;
        },
      },
    );
    const pending = controller.submit("/status");
    await vi.waitFor(() => expect(controller.commandWorking).toBe(true));
    expect(controller.busy).toBe(true);
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    release();
    await pending;
    expect(controller.commandWorking).toBe(false);
    expect(controller.busy).toBe(false);
    expect(controller.items.at(-1)).toMatchObject({
      type: "status",
      layout: "report",
    });
    await controller.close();
  });

  it("activates bundled /research and lets a folder skill override it", async () => {
    const { controller, runtime } = await createSkillController(
      {},
      { bundled: [BUNDLED_RESEARCH_SKILL] },
    );
    await controller.submit("/research OAuth");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      controller.items.some(
        (item) =>
          item.type === "skill-activation" && item.skillName === "research",
      ),
    ).toBe(true);
    expect(runtime.lastRequest?.skillActivations?.[0]).toMatchObject({
      skillName: "research",
      arguments: "OAuth",
    });
    expect(runtime.sessions.at(-1)?.prompts).toContain("OAuth");
    await controller.close();

    const overridden = await createSkillController(
      {
        "Projects/.agents/skills/research/SKILL.md": `---
name: research
description: Folder research override
---
Folder body.
`,
      },
      { bundled: [BUNDLED_RESEARCH_SKILL] },
    );
    await overridden.controller.submit("/research folders");
    await vi.waitFor(() => expect(overridden.controller.busy).toBe(false));
    const activation = overridden.controller.items.find(
      (item) => item.type === "skill-activation",
    );
    expect(activation).toMatchObject({ skillName: "research" });
    expect(
      overridden.runtime.lastRequest?.skillActivations?.[0]?.instructions,
    ).toContain("Folder body");
    await overridden.controller.close();
  });

  it("ships bundled lapis-notes as model-invocable and not user-invocable", async () => {
    expect(BUNDLED_LAPIS_NOTES_SKILL.userInvocable).toBe(false);
    expect(BUNDLED_LAPIS_NOTES_SKILL.modelInvocable).toBe(true);
    const { controller, runtime } = await createSkillController(
      {},
      { bundled: [BUNDLED_LAPIS_NOTES_SKILL] },
    );
    await controller.submit("hello");
    await vi.waitFor(() => expect(controller.busy).toBe(false));
    expect(
      runtime.lastRequest?.skillSnapshot?.skills.map((skill) => skill.name),
    ).toContain("lapis-notes");
    expect(
      String(runtime.lastRequest?.metadata?.availableSkillsManifest),
    ).toContain("<name>lapis-notes</name>");
    await controller.submit("/lapis-notes");
    expect(controller.error).toMatch(/Unknown command/u);
    await controller.close();

    const overridden = await createSkillController(
      {
        "Projects/.agents/skills/lapis-notes/SKILL.md": `---
name: lapis-notes
description: Folder lapis notes
---
Folder lapis notes body.
`,
      },
      { bundled: [BUNDLED_LAPIS_NOTES_SKILL] },
    );
    await overridden.controller.submit("hello");
    await vi.waitFor(() => expect(overridden.controller.busy).toBe(false));
    const loaded = await overridden.skills.resolve("lapis-notes", {
      scopeDir: "Projects",
    });
    expect(loaded?.source).toBe("folder");
    await overridden.controller.close();
  });

  it("invokes Search /search through AppToolHost without a model prompt", async () => {
    const execute = vi.fn(async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            results: [
              {
                path: "Projects/auth.md",
                score: 1,
                snippets: [{ text: "OAuth tokens", offset: 0 }],
              },
            ],
          }),
        },
      ],
      structuredContent: {
        results: [
          {
            path: "Projects/auth.md",
            score: 1,
            snippets: [{ text: "OAuth tokens", offset: 0 }],
          },
        ],
      },
    }));
    const extensions = new AppSlashCommandRegistry();
    extensions.register(
      { pluginId: "search" },
      {
        name: "search",
        description: "Search notes",
        argumentHint: "<query>",
        dispatch: { kind: "tool", tool: "notes_search" },
      },
    );
    const { controller, runtime, appToolHost } = await createSkillController(
      {},
      {
        extensions,
        tool: {
          name: "notes_search",
          description: "Search",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false,
          },
          effect: "read",
          execute,
        },
      },
    );
    const invoke = vi.spyOn(appToolHost, "invoke");
    await controller.submit("/search OAuth");
    expect(invoke).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: "notes_search",
        input: { query: "OAuth" },
      }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(runtime.sessions.at(-1)?.prompts ?? []).toEqual([]);
    const tool = [...controller.items]
      .reverse()
      .find((item) => item.type === "tool");
    expect(tool).toMatchObject({
      type: "tool",
      name: "notes_search",
      state: "completed",
    });
    expect(tool?.type === "tool" ? tool.input : "").toContain("OAuth");
    expect(tool?.type === "tool" ? tool.output : "").toContain(
      "Projects/auth.md",
    );
    expect(controller.items.some((item) => item.type === "status")).toBe(false);
    await controller.close();
  });
});
