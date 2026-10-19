<script lang="ts">
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  let {
    panelProps,
    view = $bindable("document"),
  }: { panelProps: AiChatPanelProps; view: "document" | "classic" } = $props();
  async function chooseView(next: "document" | "classic") {
    view = next;
    try {
      await panelProps.onSettingsChange?.({ transcriptView: next });
    } catch (error) {
      panelProps.app?.notifications.notify({
        id: "ai-presentation-error",
        source: "ai",
        severity: "error",
        title: "Conversation view",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
</script>

<div class="transcript-toolbar">
  <span class="transcript-title">Conversation</span>
  <SegmentedControl
    value={view}
    options={["document", "classic"]}
    labels={{ document: "Document", classic: "Classic" }}
    ariaLabel="Conversation view"
    onChange={(next) => {
      if (next !== "document" && next !== "classic") return;
      const pending = chooseView(next);
      panelProps.onOperation?.(pending);
    }}
  />
</div>

<style>
  .transcript-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .transcript-title {
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
</style>
