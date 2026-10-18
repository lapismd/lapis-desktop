<script lang="ts">
  import RepositorySkeleton from "../../../../src/components/repository/RepositorySkeleton.svelte";
  import { onMount, onDestroy, untrack } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RepositoryLogHeader from "../../../../src/components/repository/RepositoryLogHeader.svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import type { OperationController } from "../../../../src/lib/repository/operation-controller.ts";
  import { initialOperationState } from "../../../../src/lib/repository/operation-state.ts";
  import { operationRows } from "../../../../src/lib/repository/graph/model.ts";
  import { createLogCanvas } from "../../../../src/lib/repository/log-canvas.ts";
  import RepositoryOperationFiles from "../../../../src/components/repository/RepositoryOperationFiles.svelte";
  import RepositoryOperationColumn from "../../../../src/components/repository/RepositoryOperationColumn.svelte";
  import RepositoryShell from "../../../../src/components/repository/RepositoryShell.svelte";
  import RepositoryGraph from "../../../../src/components/repository/RepositoryGraph.svelte";
  import type { RepositoryWorkspace } from "../../../../src/lib/repository/workspaces.ts";
  let {
    controller,
    initialOperation,
    reviewCommits,
    workspaces = [],
    initialSelected = true,
    copyText,
  }: {
    controller: OperationController;
    initialOperation?: string;
    initialSelected?: boolean;
    reviewCommits: import("@lapismd/jj-history").LocalGraphCommit[];
    workspaces?: readonly RepositoryWorkspace[];
    copyText(value: string): Promise<void>;
  } = $props();
  let snapshot = $state(initialOperationState());
  let workspace = $state<string | null>("default");
  const pins = $derived([
    ...new Set([
      ...snapshot.heads,
      ...(snapshot.operation ? [snapshot.operation] : []),
    ]),
  ]);
  const rows = $derived(operationRows(snapshot.nodes));
  const selection = $derived(
    `${snapshot.selected?.id ?? ""}/${snapshot.files.path ?? ""}`,
  );
  const canvas = createLogCanvas();
  let selectedOperation: string | undefined;
  onDestroy(() => void canvas.dispose());
  $effect(() => {
    selection;
    const id = untrack(() => snapshot.selected?.id);
    const path = untrack(() => snapshot.files.path);
    untrack(() => {
      canvas.clear();
      if (id) {
        canvas.select(0, id);
      }
      if (id && id !== selectedOperation) canvas.open("diff");
      selectedOperation = id;
      if (path) {
        canvas.select(1, path);
        canvas.open("diff");
      } else if (!id) canvas.close("diff");
    });
  });
  onMount(() => {
    const unsubscribe = controller.subscribe((value) => (snapshot = value));
    void (async () => {
      await controller.refresh(initialOperation);
      if (!initialSelected || !controller.state.nodes[0]) return;
      await controller.select(controller.state.nodes[0]);
      const group = controller.files.state.groups[0];
      if (group) {
        await controller.files.selectGroup(group.change);
        if (controller.files.state.paths[0])
          await controller.files.selectPath(
            controller.files.state.paths[0].path,
          );
      }
    })().catch((error) => controller.feedback.report(error));
    return unsubscribe;
  });
</script>

<RepositoryShell>
  <section
    class="repository-operations"
    aria-label="Repository operation log"
    aria-busy={snapshot.busy}
  >
    <div class="operation-columns">
      <ColumnCanvas.Root controller={canvas} aria-label="Operation log columns">
        <ColumnCanvas.Column
          id="revisions"
          columnTitle="Op Log"
          aria-label="Operations"
        >
          <RepositoryLogHeader
            {workspaces}
            {workspace}
            onWorkspaceSelect={(next) => {
              if (workspace === next) return;
              workspace = next;
              void controller.clearSelection();
            }}
            {copyText}
            nodes={snapshot.nodes}
            title="Op Log"
            count={snapshot.nodes.length}
            operations={pins}
            operation={snapshot.operation}
            selectionLabel="Pinned operation"
            busy={snapshot.busy}
            onSelect={(operation) => controller.selectPin(operation)}
            onRefresh={() => controller.refresh()}
          />
          <ColumnCanvas.Body>
            {#if snapshot.phase === "loading"}<RepositorySkeleton
                label="Preparing operation log…"
              />
            {:else if snapshot.phase === "unavailable"}<p role="status">
                Operation log is unavailable for this vault. Refresh to try
                again.
              </p>
            {:else if !snapshot.headsReady}<RepositorySkeleton
                label="Loading repository operations…"
              />
            {:else if !snapshot.operation}<p role="status">
                {snapshot.heads.length > 1
                  ? "Choose an operation to inspect its ancestry."
                  : "No repository operations available."}
              </p>{/if}
            {#if snapshot.snapshot}
              {#if snapshot.selected && !snapshot.nodes.some((node) => node.id === snapshot.selected?.id)}
                <section aria-label="Selected operation outside loaded graph">
                  <p>The selected operation is outside this graph page.</p>
                  <RepositoryOperationFiles
                    commits={reviewCommits}
                    {copyText}
                    state={snapshot}
                    {controller}
                    onOpenDiff={() => canvas.open("diff")}
                    onOpenDetails={() => canvas.open("diff")}
                  />
                </section>
              {/if}
              {#if !snapshot.ready && !snapshot.busy}<p role="status">
                  Operations are unavailable. Refresh to try again.
                </p>
              {:else if snapshot.ready && !snapshot.nodes.length}<p>
                  No operations in this history.
                </p>{/if}
              <RepositoryGraph
                operationTitles
                onCopyError={controller.feedback.report}
                {copyText}
                commitLabel="operation ID"
                revisions={rows}
                selectedId={snapshot.selected?.id}
                label="Operation graph"
                onSelect={(id) => {
                  const node = snapshot.nodes.find((item) => item.id === id);
                  if (node)
                    void (snapshot.selected?.id === id
                      ? controller.clearSelection()
                      : controller.select(node));
                }}
              >
                {#snippet selectedFiles()}<RepositoryOperationFiles
                    commits={reviewCommits}
                    {copyText}
                    state={snapshot}
                    {controller}
                    onOpenDiff={() => canvas.open("diff")}
                    onOpenDetails={() => canvas.open("diff")}
                  />{/snippet}
              </RepositoryGraph>
              {#if snapshot.next}<Button
                  size="sm"
                  disabled={snapshot.busy}
                  onclick={() => controller.more()}>More operations</Button
                >{/if}
              {#if snapshot.nodes.length === 200}<p>
                  Showing the first 200 operations.
                </p>{/if}
            {/if}
          </ColumnCanvas.Body>
        </ColumnCanvas.Column>
        <RepositoryOperationColumn state={snapshot} {controller} {copyText} />
      </ColumnCanvas.Root>
    </div>
  </section>
</RepositoryShell>

<style>
  .repository-operations {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
    font-size: 0.875rem;
  }
  .operation-columns {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
  p {
    padding: 0.75rem;
  }
</style>
