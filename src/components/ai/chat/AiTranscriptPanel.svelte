<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import {
    Transcript,
    TranscriptFooter,
    TranscriptController,
  } from "@lapismd/design-core/chat";
  import { SegmentedControl } from "@lapismd/design-core/forms";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import {
    projectAiTranscript,
    transcriptSourceItem,
  } from "../../../lib/ai/chat/transcript-projection.ts";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import { transcriptCommentContext } from "../../../lib/ai/chat/transcript-context.ts";
  import AiTranscriptBlock from "./AiTranscriptBlock.svelte";
  import AiTranscriptComposer from "./AiTranscriptComposer.svelte";
  import AiTranscriptLoading from "./AiTranscriptLoading.svelte";
  import ChatComposerActions from "./ChatComposerActions.svelte";
  import ChatComposerOptions from "./ChatComposerOptions.svelte";
  import ChatConversationPicker from "./ChatConversationPicker.svelte";
  import ChatScopeFooter from "./ChatScopeFooter.svelte";

  let panel: TranscriptPanelProps = $props();
  const {
    panelProps,
    controller,
    composerState,
    attachmentsState,
    conversationsState,
    actions,
  } = $derived(panel);
  let view = $state<"document" | "classic">(
    untrack(
      () =>
        panelProps.initialTranscriptView ??
        panelProps.settings?.transcriptView ??
        "document",
    ),
  );
  $effect(() => {
    const preference = panelProps.settings?.transcriptView;
    if (preference && !panelProps.initialTranscriptView) view = preference;
  });
  let documentActions = $state<Snippet>();
  const items = $derived(
    projectAiTranscript(controller.items, controller.bindings),
  );
  const blocked = $derived(
    Boolean(panelProps.initializing || composerState.catalogState?.loading),
  );
  const commentState = new TranscriptController(() => ({
    items,
    canComment: !blocked,
    onSend: async (snapshot) => {
      if (blocked || controller.busy)
        return {
          publication: "refused",
          error: "Wait for the active turn to finish.",
        };
      const acknowledged = await actions.submitTranscript(
        snapshot.text,
        transcriptCommentContext(snapshot),
      );
      return !acknowledged || controller.error
        ? {
            publication: "unknown",
            error:
              controller.error ?? "This submission has not been acknowledged.",
          }
        : { publication: "published", batchId: snapshot.id };
    },
  }));
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
  async function send() {
    const value = composerState.draft;
    if (
      blocked ||
      controller.busy ||
      (!value.trim() && !commentState.pending.length)
    )
      return;
    commentState.message = value;
    const accepted = await commentState.send();
    if (accepted && composerState.draft === value) composerState.draft = "";
  }
</script>

<div class="transcript-panel" data-testid="ai-transcript-panel">
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
  {#if panelProps.initializing}<AiTranscriptLoading />{:else}<Transcript
      {items}
      {view}
      label="AI conversation"
      logLabel="AI conversation messages"
      loading={panelProps.initializing}
      {commentState}
      canComment={!blocked}
      reactionsDisabled
      authorPopover={{ interaction: "hover" }}
    >
      {#snippet beforeItems()}
        <div class="transcript-conversations">
          <ChatConversationPicker
            {panelProps}
            {controller}
            {conversationsState}
            {actions}
          />
        </div>
      {/snippet}
      {#snippet metadataSupplement(item)}
        {@const source = controller.items.find((entry) => entry.id === item.id)}
        {#if source?.type === "message" && source.role === "assistant"}
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Copy response"
            onclick={() => void actions.copyResponse(source.text)}
            ><CopyIcon aria-hidden="true" /></Button
          >
        {/if}
      {/snippet}
      {#snippet customBlock(block)}
        {@const item = transcriptSourceItem(block, controller.items)}
        {#if item}<AiTranscriptBlock {item} {panel} />{/if}
      {/snippet}
      {#snippet emptyState()}
        <Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"
              ><SparklesIcon aria-hidden="true" /></Empty.Media
            ><Empty.Title>Start a conversation</Empty.Title><Empty.Description
              >Ask a question or attach a note to explore it together.</Empty.Description
            ></Empty.Header
          ></Empty.Root
        >
      {/snippet}
      {#snippet afterItems()}
        {#if composerState.showWorkingIndicator}<div
            class="transcript-activity"
            role="status"
          >
            <Spinner /><span>{composerState.workingLabel}</span>
          </div>{/if}
      {/snippet}
      {#snippet composer(appliedView)}
        <AiTranscriptComposer
          {panel}
          view={appliedView}
          onSend={() => void send()}
          bind:documentActions
        />
      {/snippet}
      {#snippet footer()}
        <TranscriptFooter
          busy={controller.busy}
          state={commentState}
          hasContent={!controller.busy &&
            Boolean(composerState.draft.trim() || commentState.pending.length)}
          canSend={!controller.busy &&
            Boolean(composerState.draft.trim() || commentState.pending.length)}
          disabled={blocked}
          onSend={send}
          onStop={() => panel.actions.perform(() => controller.cancel())}
          status={composerState.composerStatus}
        >
          {#snippet actions()}
            <ChatComposerActions
              compact
              {panelProps}
              {controller}
              {attachmentsState}
              actions={panel.actions}
            />
            {@render documentActions?.()}
          {/snippet}
          {#snippet controls()}
            <div class="transcript-controls">
              <ChatComposerOptions
                {panelProps}
                {controller}
                {composerState}
                actions={panel.actions}
              />
            </div>
          {/snippet}
          {#snippet workspace()}<ChatScopeFooter
              inline
              {panelProps}
              {controller}
              {conversationsState}
              actions={panel.actions}
            />{/snippet}
        </TranscriptFooter>
      {/snippet}
    </Transcript>{/if}
</div>

<style>
  .transcript-panel {
    box-sizing: border-box;
    padding-block-end: var(--ui-ai-chat-bottom-clearance);
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    flex: 1;
    height: 100%;
  }
  .transcript-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .transcript-conversations {
    padding-inline: 0.75rem;
  }
  .transcript-title {
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
  .transcript-controls {
    gap: 0.25rem;
    display: flex;
    align-items: center;
  }
  .transcript-activity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
</style>
