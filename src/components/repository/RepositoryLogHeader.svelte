<script lang="ts">
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  let {
    title,
    count,
    operations,
    operation,
    selectionLabel = "Operation",
    busy,
    onSelect,
    onRefresh,
  }: {
    title: string;
    count: number;
    operations: string[];
    operation: string | undefined;
    selectionLabel?: string;
    busy: boolean;
    onSelect(operation: string): void;
    onRefresh(): void;
  } = $props();
  const short = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`;
</script>

<ColumnCanvas.Header role="group" aria-label={`${title} header`}>
  <div data-ui-component="column-canvas" data-ui-part="column-header-main">
    <ColumnCanvas.Title>{title}</ColumnCanvas.Title>
    <ColumnCanvas.Count>{count}</ColumnCanvas.Count>
  </div>
  <div class="repository-log-actions">
    <select
      aria-label={selectionLabel}
      title={operation
        ? `Pinned operation ${operation}`
        : "Select an operation"}
      value={operation ?? ""}
      disabled={!operations.length}
      onchange={(event) => onSelect(event.currentTarget.value)}
    >
      <option value="" disabled>Select operation</option>
      {#each operations as id (id)}
        <option value={id} title={id} aria-label={id}>{short(id)}</option>
      {/each}
    </select>
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Refresh"
      title="Refresh"
      disabled={busy}
      onclick={onRefresh}><RefreshIcon aria-hidden="true" /></Button
    >
    <ColumnCanvas.Toggle columnTitle={title} />
  </div>
</ColumnCanvas.Header>

<style>
  .repository-log-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    --ui-button-radius: 999px;
  }
  select {
    width: 8rem;
    min-width: 0;
    max-width: 100%;
    padding: 0.25rem;
    font: inherit;
    font-size: 0.75rem;
    color: var(--foreground);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    text-overflow: ellipsis;
  }
</style>
