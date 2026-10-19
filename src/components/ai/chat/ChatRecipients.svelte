<!-- Adapted from jj-store CommunityComposerAgentAudience.svelte; Notes owns routing. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import XIcon from "@lucide/svelte/icons/x";
  import type { SavedAgentRecipient } from "../../../lib/ai/conversations/recipients.ts";
  let {
    recipients,
    onRemove,
    disabled = false,
    label = "Message recipients",
  }: {
    recipients: readonly SavedAgentRecipient[];
    onRemove?: (id: string) => void;
    disabled?: boolean;
    label?: string;
  } = $props();
</script>

{#if recipients.length}
  <div class="chat-recipients" role="group" aria-label={label}>
    {#each recipients as recipient (recipient.id)}
      <Badge variant="secondary">
        <Avatar name={recipient.label} size="xs" shape="rounded" decorative />
        <span>@{recipient.label}</span>
        {#if onRemove}<Button
            type="button"
            variant="ghost"
            size="icon-xs"
            {disabled}
            aria-label={`Remove recipient @${recipient.label}`}
            onclick={() => onRemove?.(recipient.id)}
          >
            <XIcon aria-hidden="true" />
          </Button>{/if}
      </Badge>
    {/each}
  </div>
{/if}

<style>
  .chat-recipients {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
</style>
