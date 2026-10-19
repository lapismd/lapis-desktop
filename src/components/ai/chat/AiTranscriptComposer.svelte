<script lang="ts">
  import { MarkdownComposer } from "@lapismd/design-core/chat";
  import type { Snippet } from "svelte";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import ChatContextUsage from "./ChatContextUsage.svelte";
  import ChatComposerDrawer from "./ChatComposerDrawer.svelte";
  import ChatRecipients from "./ChatRecipients.svelte";

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
        (controller.busy && !controller.repository),
    ),
  );
  const framedDrawer = $derived(
    view === "classic" &&
      (attachmentsState.attachments.length > 0 ||
        Boolean(attachmentsState.pendingInteraction)),
  );
</script>

{#snippet attachmentsDrawer()}
  <ChatComposerDrawer {controller} {attachmentsState} {actions} />
{/snippet}

<div class="transcript-composer">
  <ChatRecipients
    recipients={composerState.recipients.display}
    {disabled}
    onRemove={(id) => composerState.recipients.remove(id)}
  />
  {#if view === "document"}
    <ChatComposerDrawer
      {controller}
      {attachmentsState}
      {actions}
      presentation="document"
    />
  {/if}
  {#if !panel.panelProps.transcriptFrame}<ChatContextUsage
      {controller}
      {composerState}
      {actions}
    />{/if}
  <MarkdownComposer
    {...framedDrawer ? { drawer: attachmentsDrawer } : {}}
    interactiveDrawerWhenDisabled
    bind:value={composerState.draft}
    bind:documentActions
    presentation={view === "document" ? "document" : "framed"}
    dockActions={view === "document"}
    showSendButton={false}
    showHint={!panel.panelProps.transcriptFrame}
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
    --ui-markdown-composer-min-height: calc(2 * 1.4rem + 1rem);
    --ui-markdown-composer-document-min-height: calc(2 * 0.875rem * 1.65);
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
</style>
