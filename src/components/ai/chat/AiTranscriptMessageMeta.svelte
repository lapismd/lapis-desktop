<script lang="ts">
  import ChatRecipients from "./ChatRecipients.svelte";
  import AiRetryTurn from "./AiRetryTurn.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let { panel, itemId }: { panel: TranscriptPanelProps; itemId: string } =
    $props();
  const { controller, composerState, actions } = $derived(panel);
  const source = $derived(
    controller.items.find((entry) => entry.id === itemId),
  );
</script>

{#if source?.type === "error"}<AiRetryTurn {panel} errorId={source.id} />{/if}
{#if source?.type === "message" && source.role === "user" && source.recipients?.length}
  <ChatRecipients
    recipients={source.recipients}
    options={composerState.recipientOptions}
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
