<script lang="ts">
  import { registerAiReview } from "./review.ts";
  import { untrack } from "svelte";
  import { onMount } from "svelte";
  import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
  import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
  import type { App } from "@lapis-notes/api";
  import AiChatPanel from "../../../src/components/ai/chat/AiChatPanel.svelte";
  import type { FakeAgentTrace } from "../../../tests/ai/support/fake-runtime.ts";
  import { createDemoRuntime } from "./runtime.ts";
  import { SkillRegistry } from "../../../src/lib/ai/skills/registry.ts";
  import { SlashCommandCatalog } from "../../../src/lib/ai/commands/catalog.ts";
  import { SlashCommandRouter } from "../../../src/lib/ai/commands/router.ts";
  import { createMemorySessionStore } from "../../../src/lib/ai/sessions/session-store.ts";
  import {
    formatFileMention,
    searchVaultFiles,
    type VaultFileRef,
  } from "../../../src/lib/ai/chat/chat-mentions.ts";
  import type { AiChatItem } from "../../../src/lib/ai/chat/chat-items.ts";
  import type { AgentRuntime } from "../../../src/lib/ai/core/runtime.ts";
  import type { AiPluginSettings } from "../../../src/lib/ai/settings/ai-settings.ts";
  import type { ModelRef } from "../../../src/lib/ai/core/models.ts";
  import { createChatApp } from "./app-fixture.ts";
  let {
    requireApproval = false,
    rejectApproval = false,
    rejectQuestion = false,
    requireQuestion = false,
    persist = false,
    trace = "echo",
    seedItems = [],
    modelCatalogError = null,
    loadModels,
    models = [
      { provider: "codex", model: "gpt-5.6-sol" },
      { provider: "codex", model: "gpt-5.4-medium" },
    ],
    files = [
      { path: "Notes/alpha.md", name: "alpha" },
      { path: "Notes/beta.md", name: "beta" },
    ],
    preservePending = false,
    seededHeight = "22rem",
    enableSkills = false,
    enableSearchResult = false,
    enableMemoryRecall = false,
    enableMarkdown = false,
    showRuntimeSelection = false,
  }: {
    requireApproval?: boolean;
    rejectApproval?: boolean;
    rejectQuestion?: boolean;
    requireQuestion?: boolean;
    persist?: boolean;
    trace?: FakeAgentTrace;
    seedItems?: AiChatItem[];
    modelCatalogError?: string | null;
    loadModels?: (agent: string, runtime: string) => Promise<ModelRef[]>;
    models?: ModelRef[];
    files?: VaultFileRef[];
    preservePending?: boolean;
    seededHeight?: string;
    enableSkills?: boolean;
    enableSearchResult?: boolean;
    enableMemoryRecall?: boolean;
    enableMarkdown?: boolean;
    showRuntimeSelection?: boolean;
  } = $props();
  let openedTick = $state(0);
  let recallCalls = $state(0);
  const openedPaths: string[] = [];

  const fixture = untrack(() =>
    enableSearchResult || enableMarkdown
      ? createChatApp((path) => {
          openedPaths.push(path);
          openedTick += 1;
        })
      : undefined,
  );
  const panelApp = fixture?.app;
  let fixtureReady = $state(!fixture);
  let fixtureError = $state("");
  onMount(() => {
    if (!fixture) return;
    let disposed = false;
    void fixture.ready
      .then(() => {
        if (!disposed) fixtureReady = true;
      })
      .catch((error) => {
        fixtureError = String(error);
      });
    return () => {
      disposed = true;
      void fixture.close().catch(console.error);
    };
  });
  const runtime = $derived(
    createDemoRuntime({
      requireApproval,
      requireQuestion,
      trace,
      rejectApproval,
      rejectQuestion,
      preservePending,
    }),
  );
  const skillHarness = $derived.by(() => {
    if (!enableSkills) return undefined;
    const vault = new Vault(new MemoryVaultAdapter());
    const skills = new SkillRegistry({
      vault,
      bundled: [
        {
          id: "bundled:research-notes",
          name: "research-notes",
          description: "Research notes in the current folder",
          source: "bundled" as const,
          root: "bundled/research-notes",
          version: "demo",
          userInvocable: true,
          modelInvocable: true,
          command: { kind: "model" as const },
          instructions: "Use notes_search then read.",
        },
      ],
    });
    const extensions = new AppSlashCommandRegistry();
    const extension = extensions.register(
      { pluginId: "demo" },
      {
        name: "open-daily-note",
        description: "Open today's daily note",
        dispatch: { kind: "host", execute: () => undefined },
      },
    );
    return {
      skills,
      slashRouter: new SlashCommandRouter(
        new SlashCommandCatalog(extensions),
        skills,
      ),
      unloadExtension: () => extension.dispose(),
    };
  });

  const sessionStore = $derived(
    persist || seedItems.length > 0
      ? createMemorySessionStore(
          seedItems.length > 0
            ? [
                {
                  id: "ai:default",
                  runtime: "fake",
                  runtimeSessionId: "fake-seed",
                  createdAt:
                    seedItems[0]?.createdAt ?? "2026-03-15T10:00:00.000Z",
                  updatedAt:
                    seedItems.at(-1)?.createdAt ?? "2026-03-16T10:00:00.000Z",
                  items: seedItems,
                },
              ]
            : [],
        )
      : undefined,
  );
  let settings = $state<
    Pick<
      AiPluginSettings,
      | "defaultModel"
      | "thinking"
      | "memoryAutomaticRecall"
      | "defaultRuntime"
      | "acpAgent"
    >
  >({
    defaultModel: "gpt-5.6-sol",
    thinking: "medium",
    memoryAutomaticRecall: untrack(() => enableMemoryRecall),
    defaultRuntime: "acp",
    acpAgent: "codex",
  });
  const memoryRecall = {
    async recall() {
      recallCalls += 1;
      return [
        {
          kind: "memory-recall" as const,
          id: "memory:storybook-headings:1",
          content: "Use compact headings in Atlas notes.",
          metadata: {
            notePath: "Memory/MEMORY.md",
            anchor: "storybook-headings",
            revision: 1,
            scope: "project" as const,
          },
        },
      ];
    },
  };

  async function fileSearch(query: string) {
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  }
  let root = $state<HTMLDivElement>();
  $effect(() => {
    if (root)
      return registerAiReview(root, {
        actions: {
          "Unload extension command": () => skillHarness?.unloadExtension(),
          "Choose Cursor in Settings": () => {
            settings = {
              ...settings,
              acpAgent: "cursor",
              defaultRuntime: "acp",
              defaultModel: "",
            };
          },
        },
      });
  });
</script>

<div
  bind:this={root}
  data-ai-review
  class="ai-chat-demo"
  class:ai-chat-demo--seeded={seedItems.length > 0}
  style:--ai-chat-demo-seeded-height={seededHeight}
  data-testid="ai-chat-demo"
  data-opened-paths={openedTick >= 0 ? openedPaths.join(",") : ""}
  data-memory-recall-calls={recallCalls}
  data-selected-runtime={settings.defaultRuntime}
  data-selected-agent={settings.acpAgent}
>
  {#if fixtureReady}
    <AiChatPanel
      initialTranscriptView="classic"
      app={panelApp}
      {runtime}
      selectRuntime={showRuntimeSelection ? async () => runtime : undefined}
      {sessionStore}
      skills={skillHarness?.skills}
      slashRouter={skillHarness?.slashRouter}
      {fileSearch}
      {models}
      {modelCatalogError}
      {loadModels}
      {settings}
      memoryRecall={enableMemoryRecall ? memoryRecall : undefined}
      onSettingsChange={(patch) => {
        settings = { ...settings, ...patch };
      }}
    />
  {/if}
  {#if fixtureError}<p role="alert">{fixtureError}</p>{/if}
</div>

<style>
  .ai-chat-demo {
    display: flex;
    flex-direction: column;
    min-height: 28rem;
    height: calc(100dvh - 2rem);
  }

  .ai-chat-demo > :global([data-ui-component="ai-chat-panel"]) {
    flex: 1 1 auto;
    min-height: 0;
  }

  .ai-chat-demo--seeded {
    height: var(--ai-chat-demo-seeded-height);
    min-height: var(--ai-chat-demo-seeded-height);
    max-height: var(--ai-chat-demo-seeded-height);
  }
</style>
