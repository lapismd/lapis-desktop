<script lang="ts">
  import ChatMessageComposer from "./ChatMessageComposer.svelte";
  import type { Snippet } from "svelte";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import ChatContextUsage from "./ChatContextUsage.svelte";
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
        !composerState.draftReady ||
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

<ChatMessageComposer
  bind:handle={composerState.input}
  bind:value={composerState.draft}
  bind:documentActions
  {view}
  {disabled}
  {framedDrawer}
  drawer={attachmentsDrawer}
  triggers={composerState.mentionTriggers}
  agentOptions={composerState.recipientOptions}
  people={panel.panelProps.mentionPeople}
  app={panel.panelProps.app}
  showHint={!panel.panelProps.transcriptFrame}
  {onSend}
>
  {#snippet before()}
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
  {/snippet}
</ChatMessageComposer>
