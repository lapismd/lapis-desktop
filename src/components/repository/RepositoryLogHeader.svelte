<script lang="ts">
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RepositoryOperationPinPicker from "./RepositoryOperationPinPicker.svelte";
  import RepositoryWorkspacePicker from "./RepositoryWorkspacePicker.svelte";
  import type { RepositoryWorkspace } from "../../lib/repository/workspaces.ts";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  let {
    title,
    count,
    operations,
    operation,
    nodes = [],
    selectionLabel = "Operation",
    busy,
    onSelect,
    onRefresh,
    copyText,
    workspaces,
    workspace,
    onWorkspaceSelect,
    onWorkspaceOpen,
  }: {
    title: string;
    count: number;
    operations: string[];
    operation: string | undefined;
    nodes?: readonly LocalGraphOperationNode[];
    selectionLabel?: string;
    busy: boolean;
    onSelect(operation: string): void;
    onRefresh(): void;
    copyText(value: string): Promise<void>;
    workspaces: readonly RepositoryWorkspace[];
    workspace: string | null;
    onWorkspaceSelect(workspace: string | null): void;
    onWorkspaceOpen?(): void;
  } = $props();
</script>

<ColumnCanvas.Header role="group" aria-label={`${title} header`}>
  <div data-ui-component="column-canvas" data-ui-part="column-header-main">
    <ColumnCanvas.Title>{title}</ColumnCanvas.Title>
    <ColumnCanvas.Count>{count}</ColumnCanvas.Count>
  </div>
  <div class="repository-log-actions">
    <RepositoryWorkspacePicker
      {workspaces}
      selected={workspace}
      disabled={!operation}
      onSelect={onWorkspaceSelect}
      onOpen={onWorkspaceOpen}
    />
    <RepositoryOperationPinPicker
      {operations}
      {operation}
      {nodes}
      label={selectionLabel}
      {onSelect}
      {copyText}
    />
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
    flex: 0 1 auto;
    justify-content: flex-end;
    --ui-button-radius: 999px;
  }
</style>
