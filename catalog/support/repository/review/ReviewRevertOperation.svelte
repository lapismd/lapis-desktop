<script lang="ts">
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ConfirmDialog } from "@lapismd/design-core/forms/dialog";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  let {
    operation,
    parent,
    disabled = false,
  }: {
    operation: LocalGraphOperationNode;
    parent?: string;
    disabled?: boolean;
  } = $props();
  let open = $state(false);
</script>

<Button
  size="xs"
  variant="outline"
  {disabled}
  aria-label="Revert selected operation"
  title="Undo this operation's changes in a new operation"
  onclick={() => (open = true)}
  ><UndoIcon data-icon="inline-start" aria-hidden="true" />Revert</Button
>
<ConfirmDialog
  bind:open
  title="Revert this operation?"
  description="Undo the selected operation’s effects in a new operation. Later work is retained where possible; the undo may introduce conflicts."
  confirmLabel="Revert operation"
  confirmDisabled
  onConfirm={() => false}
>
  <div class="revert-preview">
    <strong>{operation.description}</strong>
    <code>Operation {operation.id.slice(0, 12)}</code>
    {#if parent}<code>Comparison parent {parent.slice(0, 12)}</code>{/if}
    <p>
      Storybook preview. Applying the revert is unavailable until native
      operation commands are integrated.
    </p>
  </div>
</ConfirmDialog>

<style>
  .revert-preview {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }
  strong {
    overflow-wrap: anywhere;
    font-size: 0.875rem;
  }
  code,
  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
</style>
