<script lang="ts">
  import { MarkdownComposer } from "@lapismd/design-core/chat";
  import type { Snippet } from "svelte";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import ChatComposerDrawer from "./ChatComposerDrawer.svelte";

  let {
    panel,
    view,
    onSend,
    documentActions = $bindable(),
  }: {
    panel: TranscriptPanelProps;
    view: "document" | "classic";
    onSend: () => void;
    documentActions?: Snippet;
  } = $props();
  const { controller, composerState, attachmentsState, actions } =
    $derived(panel);
  const disabled = $derived(
    Boolean(
      panel.panelProps.initializing ||
        composerState.catalogState?.loading ||
        controller.busy,
    ),
  );
</script>

<div class="transcript-composer">
  <ChatComposerDrawer {controller} {attachmentsState} {actions} />
  <MarkdownComposer
    bind:value={composerState.draft}
    bind:documentActions
    presentation={view === "document" ? "document" : "framed"}
    dockActions={view === "document"}
    showSendButton={false}
    submitOnEnter={false}
    label="Message composer"
    inputLabel="Message"
    placeholder="Ask about your notes…"
    {disabled}
    triggers={composerState.mentionTriggers}
    onSubmit={() => {
      if (!disabled) onSend();
    }}
  >
    {#snippet avatar()}<Avatar
        name="You"
        initials="YO"
        size="sm"
        decorative
      />{/snippet}
  </MarkdownComposer>
</div>

<style>
  .transcript-composer {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
</style>
