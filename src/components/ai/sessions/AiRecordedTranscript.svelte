<script lang="ts">
  import type { Snippet } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { transcriptLinks } from "../chat/transcript-agent-links.ts";
  import "../../../styles/ai/transcript-links.css";
  import {
    Transcript,
    TranscriptController,
    type TranscriptBlock,
    type TranscriptTool,
    type TranscriptItem,
  } from "@lapismd/design-core/chat";
  import TranscriptViewToggle from "../sessions/TranscriptViewToggle.svelte";
  import AiTranscriptToolInspector from "../chat/AiTranscriptToolInspector.svelte";
  import { previewTranscriptTool } from "../../../lib/ai/chat/transcript-tool-preview.ts";
  import { projectTranscriptToChatItems } from "../../../lib/ai/conversations/transcript-to-chat.ts";
  import {
    projectAiTranscript,
    transcriptSourceItem,
  } from "../../../lib/ai/chat/transcript-projection.ts";
  import { isSlashCommandNotice } from "../../../lib/ai/chat/chat-items.ts";
  import AiCommandReport from "../chat/AiCommandReport.svelte";
  import type { TranscriptEntry } from "../../../lib/ai/conversations/types.ts";
  import { importedToolBlock } from "../../../lib/ai/imports/transcript-tool-block.ts";
  let {
    app,
    sourcePath = "",
    entries = [],
    projectedItems,
    view = $bindable<"document" | "classic">("document"),
    showViewToolbar = true,
    assistant,
    inspectTools = false,
    toolInspector = $bindable<Snippet | undefined>(),
    capturedUser = true,
    label = "Imported transcript preview",
    composer,
    busy = false,
    agentOptions = [],
  }: {
    app?: App | undefined;
    sourcePath?: string;
    entries?: TranscriptEntry[];
    projectedItems?: readonly TranscriptItem[];
    view?: "document" | "classic";
    showViewToolbar?: boolean;
    assistant?: { name: string; image: string };
    inspectTools?: boolean;
    toolInspector?: Snippet;
    capturedUser?: boolean;
    label?: string;
    composer?: Snippet<["document" | "classic"]>;
    busy?: boolean;
    agentOptions?: readonly import("../../../lib/ai/conversations/recipients.ts").AgentRecipientOption[];
  } = $props();
  function block(b: TranscriptBlock): TranscriptBlock {
    const item = transcriptSourceItem(b, source);
    const report =
      item && isSlashCommandNotice(item) && item.layout !== "inventory";
    return {
      ...b,
      commentable: false,
      kind: b.kind === "custom" && !report ? "code" : b.kind,
    };
  }
  const capturedTools = $derived(
    new Map(
      entries
        .filter((entry) => entry.type === "tool")
        .map((entry) => [entry.id, entry]),
    ),
  );
  const source = $derived(projectTranscriptToChatItems(entries));
  const items = $derived(
    (projectedItems ?? projectAiTranscript(source)).map((item) => ({
      ...item,
      label:
        capturedUser && item.role === "user"
          ? "Captured user message"
          : item.label,
      author:
        capturedUser && item.role === "user"
          ? { id: "captured-user", name: "Captured user", initials: "CU" }
          : item.role === "assistant" && item.author && assistant
            ? { ...item.author, name: assistant.name, image: assistant.image }
            : item.author,
      blocks: item.blocks.map(block),
      tools: item.tools?.map((t) => {
        const captured = capturedTools.get(t.id);
        const original = source.find((entry) => entry.id === t.id);
        const tool =
          inspectTools && original?.type === "tool"
            ? previewTranscriptTool(t, original, false)
            : {
                ...t,
                blocks: t.blocks.map((b) => importedToolBlock(b, captured)),
              };
        return {
          ...tool,
          commentable: false,
          blocks: tool.blocks.map(block),
          inlineBlocks: tool.inlineBlocks?.map(block),
        };
      }),
    })),
  );
  let selected = $state<{ id: string; opener: HTMLElement }>();
  function inspect(tool: TranscriptTool, opener: HTMLElement) {
    selected = { id: tool.id, opener };
  }
  const commentState = new TranscriptController(() => ({
    ...transcriptLinks(app, sourcePath, agentOptions, true),
    items,
    canComment: false,
    onInspectTool: inspectTools ? inspect : undefined,
  }));
  const selectedTool = $derived(
    items
      .flatMap((item) => item.tools ?? [])
      .find((tool) => tool.id === selected?.id),
  );
  $effect(() => {
    if (!inspectTools) return;
    toolInspector = inspector;
    return () => {
      toolInspector = undefined;
    };
  });
</script>

<section class="import-transcript" aria-label={label}>
  {#if showViewToolbar}<div class="import-transcript__toolbar">
      <span>Read-only snapshot</span>
      <TranscriptViewToggle bind:view />
    </div>{/if}
  <Transcript
    {items}
    scrollButton
    {commentState}
    onInspectTool={inspectTools ? inspect : undefined}
    {view}
    {composer}
    {busy}
    classicComposerPlacement={composer ? "fixed" : "inline"}
    label="Captured conversation"
    logLabel="Captured messages"
    canComment={false}
    reactionsDisabled
    authorPopover={{ interaction: "hover" }}
    {customBlock}
  />
</section>

{#snippet customBlock(b: TranscriptBlock)}
  <AiCommandReport text={b.text} />
{/snippet}

{#snippet inspector()}
  {#if inspectTools && selectedTool && selected}
    {@const selection = selected}
    {@const tool = selectedTool}
    <AiTranscriptToolInspector
      {tool}
      state={commentState}
      opener={selection.opener}
      onClose={() => (selected = undefined)}
      customBlock={undefined}
    />
  {/if}
{/snippet}

<style>
  .import-transcript {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }
  .import-transcript__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.8125rem;
    color: var(--muted-foreground);
    flex-wrap: wrap;
  }
</style>
