<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import FileIcon from "@lucide/svelte/icons/file";
  import XIcon from "@lucide/svelte/icons/x";
  import type { AttachmentsState } from "../../../lib/ai/chat/panel/attachments.svelte.ts";
  let { attachmentsState }: { attachmentsState: AttachmentsState } = $props();
</script>

<Tooltip.Provider>
  {#each attachmentsState.attachments as file (file.path)}
    <Badge variant="secondary" class="file-chip" data-ui-part="attachment-chip">
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class="file-label"
              aria-label={file.name}
            >
              <FileIcon aria-hidden="true" /><span>{file.name}</span>
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>{file.path}</Tooltip.Content>
      </Tooltip.Root>
      <button
        type="button"
        class="remove"
        data-ui-part="attachment-remove"
        aria-label={`Remove ${file.name}`}
        onclick={() => attachmentsState.removeAttachment(file.path)}
      >
        <XIcon aria-hidden="true" />
      </button>
    </Badge>
  {/each}
</Tooltip.Provider>

<style>
  .file-chip {
    display: inline-flex;
    max-width: 100%;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--ui-ai-chat-attachment-border);
    border-radius: var(--ui-ai-chat-attachment-radius);
    background: var(--ui-ai-chat-attachment-background);
    color: var(--ui-ai-chat-attachment-foreground);
    font-size: 0.75rem;
    line-height: 1rem;
  }
  .file-chip:hover {
    background: var(--ui-ai-chat-attachment-background-hover);
  }
  .file-label,
  .remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-width: 0;
    border: 0;
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }
  .file-label {
    padding-inline-start: 0.25rem;
  }
  .file-label span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove {
    flex: 0 0 1rem;
    width: 1rem;
    height: 1rem;
  }
  .remove:hover,
  .remove:focus-visible {
    background: var(--ui-ai-chat-attachment-remove-hover);
  }
  .file-label:focus-visible,
  .remove:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .file-label :global(svg),
  .remove :global(svg) {
    flex: 0 0 0.75rem;
    width: 0.75rem;
    height: 0.75rem;
  }
</style>
