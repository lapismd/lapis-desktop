<script lang="ts">
  import type { AgentMessagePresentation } from "@lapismd/agent-ui/chat";
  import { onDestroy, onMount, untrack } from "svelte";
  import {
    AgentChatScreen,
    type AgentChatPresentation,
  } from "@lapismd/agent-ui/chat";
  import { AgentUiController } from "@lapismd/agent-ui/core";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  import type { ConversationListEntry } from "../../../lib/ai/conversations/transcript-store.ts";
  import {
    DesktopChatPort,
    conversationKey,
  } from "../../../lib/ai/shared/chat-port.ts";
  import { desktopChatSnapshot } from "../../../lib/ai/shared/chat-snapshot.ts";
  import { desktopChatPresentation } from "../../../lib/ai/shared/chat-presentation.ts";
  import { sharedChanges } from "../../../lib/ai/shared/changes.svelte.ts";
  import { transcriptToolInspection } from "../../../lib/ai/chat/transcript-inspection.svelte.ts";
  import { transcriptSourceItem } from "../../../lib/ai/chat/transcript-projection.ts";
  import { transcriptLinks } from "../chat/transcript-agent-links.ts";
  import { observeDraftComments } from "../../../lib/ai/chat/panel/draft-comments.svelte.ts";
  import {
    restoreTranscriptComments,
    reclaimQueuedCommentDrafts,
  } from "../../../lib/ai/chat/restored-comments.ts";
  import { navigateDiscussionReply } from "../../../lib/ai/chat/transcript-discussions.ts";
  import { saveTranscriptView } from "../../../lib/ai/chat/panel/view-preference.ts";
  import ChatConversationMenu from "../chat/ChatConversationMenu.svelte";
  import AiTranscriptBlock from "../chat/AiTranscriptBlock.svelte";
  import { composerReferences } from "../chat/composer-references.ts";
  let panel: TranscriptPanelProps = $props();
  const references = composerReferences(
    () => panel.composerState.recipientOptions,
    () => panel.panelProps.mentionPeople ?? [],
    () => panel.panelProps.app,
  );
  let rows = $state<ConversationListEntry[]>([]);
  const inspection = transcriptToolInspection(
    () => panel,
    () => true,
  );
  const changes = sharedChanges(
    () => panel,
    () => inspection.items,
  );
  const port = untrack(
    () =>
      new DesktopChatPort(
        () => panel,
        () => desktopChatSnapshot(panel, rows, inspection.items),
        () => rows,
        (message) => {
          controller.transcript.threads = reclaimQueuedCommentDrafts(
            controller.transcript.threads,
            message.user.contextBlocks,
          );
        },
      ),
  );
  const controller: AgentUiController = untrack(
    () =>
      new AgentUiController(
        port,
        desktopChatSnapshot(panel, rows, inspection.items),
        {
          canComment: () =>
            !panel.panelProps.initializing && panel.composerState.draftReady,
          transcript: () => ({
            ...transcriptLinks(
              panel.panelProps.app,
              "",
              panel.composerState.recipientOptions,
            ),
            onNavigateReply: (id) =>
              panel.actions.perform(() =>
                navigateDiscussionReply(
                  controller.transcript,
                  inspection.items,
                  id,
                  panel.panelProps.app?.notifications,
                ),
              ),
          }),
        },
      ),
  );
  const presentation: AgentChatPresentation = untrack(() =>
    desktopChatPresentation(() => panel),
  );
  observeDraftComments(() => panel.composerState, controller.transcript);
  const restored = new WeakSet<object>();
  $effect(() => {
    const items = panel.controller.items,
      bindings = panel.controller.bindings;
    untrack(() => {
      const next = restoreTranscriptComments(
        controller.transcript.threads,
        items,
        restored,
        bindings,
      );
      if (next !== controller.transcript.threads)
        controller.transcript.threads = next;
    });
  });
  $effect(() => {
    const snapshot = desktopChatSnapshot(panel, rows, inspection.items);
    const location = panel.controller.location;
    const id = location ? conversationKey(location) : "new-session";
    const agent = panel.composerState.selectedAgent,
      recipients = [...panel.composerState.recipients.selectedIds];
    const loading = !!panel.panelProps.initializing;
    untrack(() => {
      port.publish(snapshot);
      controller.sessionId = id;
      controller.selectedAgent = agent;
      controller.recipients = recipients;
      controller.loading = loading;
    });
  });
  let followedView: string | undefined;
  $effect(() => {
    const saved =
      panel.panelProps.initialTranscriptView ??
      panel.panelProps.settings?.transcriptView ??
      "document";
    if (saved !== followedView) {
      followedView = saved;
      untrack(() => {
        controller.view = saved;
      });
    }
  });
  $effect(() => {
    const view = controller.view;
    if (view !== (panel.panelProps.settings?.transcriptView ?? "document"))
      untrack(() => saveTranscriptView(panel.panelProps, view));
  });
  onMount(() => {
    let disposed = false,
      generation = 0;
    const refresh = () => {
      const request = ++generation;
      void panel.actions.perform(async () => {
        const next = (await panel.panelProps.repository?.listAll()) ?? [];
        if (!disposed && request === generation) rows = next;
      });
    };
    const unsubscribe = panel.panelProps.repository?.subscribe(refresh);
    refresh();
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  });
  onDestroy(() => {
    const pending = controller.close();
    panel.panelProps.onControllerDispose?.(pending);
  });
  const messages = $derived(
    Object.fromEntries(
      panel.controller.items.flatMap<[string, AgentMessagePresentation]>(
        (item) =>
          item.type === "error"
            ? [[item.id, { retry: !!panel.actions.promptForError(item.id) }]]
            : item.type === "message" &&
                item.role === "user" &&
                item.recipients?.length
              ? [
                  [
                    item.id,
                    {
                      recipients: item.recipients,
                      deliveries: item.deliveries,
                    },
                  ],
                ]
              : [],
      ),
    ),
  );
  const options = $derived({
    messages,
    queueWhileAwaitingApproval: !!panel.controller.repository,
    onRetry: async (id: string) => {
      const prompt = panel.actions.promptForError(id);
      if (prompt) await panel.actions.submit(prompt);
    },
    ...transcriptLinks(
      panel.panelProps.app,
      "",
      panel.composerState.recipientOptions,
    ),
    changes,
    customBlock,
    composer: {
      triggers: panel.composerState.mentionTriggers,
      extensions: [references],
      status: panel.composerState.composerStatus,
    },
    onCopyResponse: panel.actions.copyResponse,
    workingLabel: panel.composerState.showWorkingIndicator
      ? panel.composerState.workingLabel
      : undefined,
  });
</script>

{#snippet customBlock(
  block: import("@lapismd/design-core/chat").TranscriptBlock,
)}
  {@const item = transcriptSourceItem(block, panel.controller.items)}
  {#if item}<AiTranscriptBlock {item} {panel} />{/if}
{/snippet}
{#snippet conversationMenu()}<ChatConversationMenu
    panelProps={panel.panelProps}
    controller={panel.controller}
    actions={panel.actions}
    composerState={panel.composerState}
  />{/snippet}
<AgentChatScreen
  {controller}
  {presentation}
  {conversationMenu}
  transcriptOptions={options}
/>
