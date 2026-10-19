<script lang="ts">
  import {
    MessageQueue,
    type TranscriptQueuedMessage,
  } from "@lapismd/design-core/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import PlayIcon from "@lucide/svelte/icons/play";
  import PauseIcon from "@lucide/svelte/icons/pause";
  import type { QueuedMessages } from "../../../lib/ai/chat/controller/queued-messages.svelte.ts";
  import type { ChatPanelActions } from "../../../lib/ai/chat/panel/actions.ts";
  let {
    queue,
    actions,
    onCancelled,
  }: {
    queue: QueuedMessages;
    actions: ChatPanelActions;
    onCancelled?: (
      message: import("../../../lib/ai/conversations/queued-message.ts").QueuedMessage,
    ) => void;
  } = $props();
  const entries = $derived<TranscriptQueuedMessage[]>(
    queue.entries
      .filter((e) => e.pending && e.state !== "working")
      .map((e) => ({
        id: e.queued.id,
        submission: {
          id: e.queued.id,
          text: e.queued.user.text,
          comments: (e.queued.user.contextBlocks ?? []).flatMap(
            (b) => JSON.parse(b.content).comments,
          ),
        },
        recipients: [
          {
            id: e.queued.id,
            label: e.queued.user.recipients!.map((r) => r.label).join(", "),
            state: e.state === "queued" ? "queued" : "unknown",
          },
        ],
      })),
  );
</script>

{#if entries.length}
  <div class="queued-messages">
    <MessageQueue
      {entries}
      onCancel={async (entry) => {
        await actions.cancelQueued(entry.id);
        const result = queue.entries.find((e) => e.queued.id === entry.id);
        if (result?.state === "cancelled") onCancelled?.(result.queued);
      }}
    />
    <div class="queue-controls">
      {#if queue.paused}<span>Queue paused · resumes only when requested</span
        ><Button
          variant="outline"
          size="xs"
          disabled={queue.saving ||
            queue.running ||
            queue.resuming ||
            !queue.pending.length}
          onclick={() => void actions.resumeQueue()}
          ><PlayIcon data-icon="inline-start" />Resume queue</Button
        >
      {:else}<span>Follow-ups run after active work completes</span><Button
          variant="ghost"
          size="xs"
          onclick={() => queue.pause()}
          ><PauseIcon data-icon="inline-start" />Pause queue</Button
        >{/if}
    </div>
  </div>
{/if}

<style>
  .queued-messages {
    display: grid;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    min-width: 0;
  }
  .queue-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
</style>
