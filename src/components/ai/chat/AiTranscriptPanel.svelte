<script lang="ts">
  import AiQueuedMessages from "./AiQueuedMessages.svelte";
  import ChatRecipients from "./ChatRecipients.svelte";
  import { untrack, type Snippet } from "svelte";
  import {
    Transcript,
    TranscriptController,
    type TranscriptBlock,
  } from "@lapismd/design-core/chat";
  import AiTranscriptToolbar from "./AiTranscriptToolbar.svelte";
  import AiTranscriptFooter from "./AiTranscriptFooter.svelte";
  import AiTranscriptSendHint from "./AiTranscriptSendHint.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import AiTranscriptEmpty from "./AiTranscriptEmpty.svelte";
  import AiRetryTurn from "./AiRetryTurn.svelte";
  import { transcriptSourceItem } from "../../../lib/ai/chat/transcript-projection.ts";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import { transcriptCommentContext } from "../../../lib/ai/chat/transcript-context.ts";
  import {
    restoreTranscriptComments,
    reclaimQueuedCommentDrafts,
  } from "../../../lib/ai/chat/restored-comments.ts";
  import AiTranscriptBlock from "./AiTranscriptBlock.svelte";
  import AiTranscriptComposer from "./AiTranscriptComposer.svelte";
  import AiTranscriptLoading from "./AiTranscriptLoading.svelte";
  import { navigateDiscussionReply } from "../../../lib/ai/chat/transcript-discussions.ts";
  import ChatConversationPicker from "./ChatConversationPicker.svelte";
  import AiTranscriptToolInspector from "./AiTranscriptToolInspector.svelte";
  import { transcriptToolInspection } from "../../../lib/ai/chat/transcript-inspection.svelte.ts";
  import { transcriptLinks } from "../../../lib/ai/chat/transcript-links.ts";
  import "../../../styles/ai/transcript-links.css";

  let panel: TranscriptPanelProps = $props();
  const { panelProps, controller, composerState, conversationsState, actions } =
    $derived(panel);
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
  const Frame = $derived(panelProps.transcriptFrame);
  function chooseView(next: "document" | "classic") {
    view = next;
    const saving = Promise.resolve()
      .then(() => panelProps.onSettingsChange?.({ transcriptView: next }))
      .catch((error) => {
        panelProps.app?.notifications.notify({
          id: "ai-presentation-error",
          source: "ai",
          severity: "error",
          title: "Conversation view",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    panelProps.onOperation?.(saving);
  }
  let documentActions = $state<Snippet>();
  const inspection = transcriptToolInspection(
    () => panel,
    () => !!Frame,
  );
  const items = $derived(inspection.items);
  const blocked = $derived(
    Boolean(panelProps.initializing || composerState.catalogState?.loading),
  );
  const commentState: TranscriptController = new TranscriptController(() => ({
    ...transcriptLinks(panelProps.app),
    items,
    canComment: !blocked,
    onInspectTool: Frame ? inspection.open : undefined,
    onNavigateReply: (id): Promise<void> =>
      actions.perform(() =>
        navigateDiscussionReply(
          commentState,
          items,
          id,
          panelProps.app?.notifications,
        ),
      ),
    onSend: async (snapshot) => {
      if (blocked || (controller.busy && !controller.repository))
        return {
          publication: "refused",
          error: "Wait for the active turn to finish.",
        };
      const context = transcriptCommentContext(snapshot);
      if (context.length && /^\/(?!\/)/u.test(snapshot.text.trimStart()))
        return {
          publication: "refused",
          error:
            "Send the pending comments with a regular message. Slash commands do not submit comment context.",
        };
      const acknowledged = await actions.submitTranscript(
        snapshot.text,
        context,
      );
      if (!acknowledged && actions.submissionWasRefused())
        return {
          publication: "refused",
          error: "Message was not queued. Your draft is retained.",
        };
      return !acknowledged || controller.error
        ? {
            publication: "unknown",
            error:
              controller.error ?? "This submission has not been acknowledged.",
          }
        : {
            publication: panelProps.repository ? "queued" : "published",
            batchId: snapshot.id,
          };
    },
  }));
  const restoredCommentItems = new WeakSet<object>();
  $effect(() => {
    const source = controller.items;
    const bindings = controller.bindings;
    untrack(() => {
      const next = restoreTranscriptComments(
        commentState.threads,
        source,
        restoredCommentItems,
        bindings,
      );
      if (next !== commentState.threads) commentState.threads = next;
    });
  });
  async function send() {
    const value = composerState.draft;
    if (blocked || (!value.trim() && !commentState.pending.length)) return;
    commentState.message = value;
    const accepted = await commentState.send();
    if (accepted && composerState.draft === value) composerState.draft = "";
  }
</script>

{#snippet conversation()}
  {#if panelProps.initializing}<AiTranscriptLoading />{:else}<Transcript
      {items}
      {view}
      scrollButton
      busy={controller.busy}
      footer={transcriptBottom}
      classicComposerPlacement={Frame ? "fixed" : "inline"}
      label="AI conversation"
      logLabel="AI conversation messages"
      loading={panelProps.initializing}
      {commentState}
      canComment={!blocked}
      reactionsDisabled
      authorPopover={{ interaction: "hover" }}
      onInspectTool={Frame ? inspection.open : undefined}
      {customBlock}
    >
      {#snippet beforeItems()}
        {#if !Frame}<div class="transcript-conversations">
            <ChatConversationPicker
              {panelProps}
              {controller}
              {conversationsState}
              {actions}
            />
          </div>{/if}
      {/snippet}
      {#snippet metadataSupplement(item)}
        {@const source = controller.items.find((entry) => entry.id === item.id)}
        {#if source?.type === "error"}<AiRetryTurn
            {panel}
            errorId={source.id}
          />{/if}
        {#if source?.type === "message" && source.role === "user" && source.recipients?.length}
          <ChatRecipients
            recipients={source.recipients}
            deliveries={source.deliveries}
            label="Sent to"
          />
        {/if}
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
      {#snippet emptyState()}
        <AiTranscriptEmpty />
      {/snippet}
      {#snippet queuedMessages()}<AiQueuedMessages
          onCancelled={(q) => {
            commentState.threads = reclaimQueuedCommentDrafts(
              commentState.threads,
              q.user.contextBlocks,
            );
          }}
          queue={controller.queuedMessages}
          {actions}
        />{/snippet}
      {#snippet afterItems()}
        {#if composerState.showWorkingIndicator}<div
            class="transcript-activity"
            data-testid="ai-chat-working"
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
    </Transcript>{/if}
{/snippet}

{#snippet customBlock(block: TranscriptBlock)}
  {@const item = transcriptSourceItem(block, controller.items)}
  {#if item}<AiTranscriptBlock {item} {panel} />{/if}
{/snippet}

{#snippet toolInspector()}
  {#if inspection.tool && inspection.opener}
    <AiTranscriptToolInspector
      tool={inspection.tool}
      state={commentState}
      opener={inspection.opener}
      onClose={inspection.close}
      {customBlock}
    />
  {/if}
{/snippet}

{#snippet transcriptBottom()}
  {#if Frame}<AiTranscriptSendHint {panel} error={commentState.error} />
  {:else}{@render composerFooter()}{/if}
{/snippet}

{#snippet composerFooter()}
  <AiTranscriptFooter
    {panel}
    state={commentState}
    {blocked}
    {documentActions}
    onSend={send}
  />
{/snippet}

<div
  class="transcript-panel"
  data-testid="ai-transcript-panel"
  data-framed={!!Frame}
>
  {#if Frame}<Frame
      {panel}
      {view}
      onViewChange={chooseView}
      footer={composerFooter}
      {toolInspector}
    >
      {@render conversation()}
    </Frame>
  {:else}<AiTranscriptToolbar
      {panelProps}
      bind:view
    />{@render conversation()}{/if}
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
  .transcript-panel[data-framed="true"] {
    padding-block-end: 0;
    background: var(--sidebar, var(--muted));
    --ui-transcript-body-footer-border: 0;
  }
  .transcript-conversations {
    padding-inline: 0.75rem;
  }
  .transcript-activity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--muted-foreground);
  }
</style>
