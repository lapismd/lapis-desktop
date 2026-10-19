<script lang="ts">
  import { Transcript, type TranscriptBlock } from "@lapismd/design-core/chat";
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import { projectTranscriptToChatItems } from "../../../lib/ai/conversations/transcript-to-chat.ts";
  import { projectAiTranscript } from "../../../lib/ai/chat/transcript-projection.ts";
  import type { TranscriptEntry } from "../../../lib/ai/conversations/types.ts";
  import { importedToolBlock } from "../../../lib/ai/imports/transcript-tool-block.ts";
  let {
    entries,
    view = $bindable<"document" | "classic">("document"),
    showViewToolbar = true,
    assistant,
  }: {
    entries: TranscriptEntry[];
    view?: "document" | "classic";
    showViewToolbar?: boolean;
    assistant?: { name: string; image: string };
  } = $props();
  function block(b: TranscriptBlock): TranscriptBlock {
    return {
      ...b,
      commentable: false,
      kind: b.kind === "custom" ? "code" : b.kind,
    };
  }
  const capturedTools = $derived(
    new Map(
      entries
        .filter((entry) => entry.type === "tool")
        .map((entry) => [entry.id, entry]),
    ),
  );
  const items = $derived(
    projectAiTranscript(projectTranscriptToChatItems(entries)).map((item) => ({
      ...item,
      label: item.role === "user" ? "Captured user message" : item.label,
      author:
        item.role === "user"
          ? { id: "captured-user", name: "Captured user", initials: "CU" }
          : item.role === "assistant" && item.author && assistant
            ? { ...item.author, name: assistant.name, image: assistant.image }
            : item.author,
      blocks: item.blocks.map(block),
      tools: item.tools?.map((t) => ({
        ...t,
        commentable: false,
        blocks: t.blocks.map((b) =>
          importedToolBlock(b, capturedTools.get(t.id)),
        ),
      })),
    })),
  );
</script>

<section class="import-transcript" aria-label="Imported transcript preview">
  {#if showViewToolbar}<div class="import-transcript__toolbar">
      <span>Read-only snapshot</span>
      <SegmentedControl
        value={view}
        options={["document", "classic"]}
        labels={{ document: "Document", classic: "Classic" }}
        ariaLabel="Imported transcript view"
        onChange={(next) => {
          if (next === "document" || next === "classic") view = next;
        }}
      />
    </div>{/if}
  <Transcript
    {items}
    {view}
    label="Captured conversation"
    logLabel="Captured messages"
    canComment={false}
    reactionsDisabled
    authorPopover={{ interaction: "hover" }}
  />
</section>

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
