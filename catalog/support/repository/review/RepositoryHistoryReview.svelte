<script lang="ts">
  import { RepositorySkeleton } from "@lapismd/repository-ui/jj";
  import { onMount, onDestroy, untrack } from "svelte";
  import type {
    LocalGraphOperationNode,
    LocalGraphEvolutionNode,
  } from "@lapismd/jj-history";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { createHistoryCanvas } from "../../../../src/lib/repository/history-canvas.ts";
  import ReviewConflictResolution from "./ReviewConflictResolution.svelte";
  import ReviewEvolutionColumn from "./ReviewEvolutionColumn.svelte";
  import { RepositoryLogHeader } from "@lapismd/repository-ui/jj";
  import type { HistoryController } from "@lapismd/repository-ui/history";
  import { initialHistoryState } from "@lapismd/repository-ui/history";
  import { RepositoryRevisions } from "@lapismd/repository-ui/jj";
  import RepositoryDiffColumn from "../../../../src/components/repository/RepositoryDiffColumn.svelte";
  import RepositoryShell from "../../../../src/components/repository/RepositoryShell.svelte";
  import type { RepositoryWorkspace } from "../../../../src/lib/repository/workspaces.ts";
  let {
    controller,
    initialOperation,
    initialRevision,
    operationNodes = [],
    evolutionNodes = [],
    initialEvolution = false,
    workspaces = [],
    copyText,
  }: {
    controller: HistoryController;
    initialOperation?: string;
    initialRevision?: string;
    operationNodes?: readonly LocalGraphOperationNode[];
    evolutionNodes?: readonly LocalGraphEvolutionNode[];
    initialEvolution?: boolean;
    workspaces?: readonly RepositoryWorkspace[];
    copyText(value: string): Promise<void>;
  } = $props();
  let snapshot = $state(initialHistoryState());
  let workspace = $state<string | null>("default");
  const operations = $derived([
    ...new Set([
      ...snapshot.heads,
      ...(snapshot.operation ? [snapshot.operation] : []),
    ]),
  ]);
  const canvas = createHistoryCanvas();
  let evolutionAnchor = $state<string>();
  let conflictsOpen = $state(false);
  const mainSelection = $derived(
    `${snapshot.operation ?? ""}/${snapshot.revision?.id ?? ""}`,
  );
  $effect(() => {
    mainSelection;
    untrack(() => {
      evolutionAnchor = undefined;
      conflictsOpen = false;
      canvas.close("evolution");
      canvas.close("evolution-diff");
    });
  });
  function openEvolution(id?: string) {
    if (!id) return;
    evolutionAnchor = id;
    canvas.open("evolution");
  }
  onDestroy(() => void canvas.dispose());
  const selection = $derived(
    `${snapshot.revision?.id ?? ""}/${snapshot.path ?? ""}`,
  );
  $effect(() => {
    selection;
    const revision = untrack(() => snapshot.revision?.id);
    const path = untrack(() => snapshot.path);
    untrack(() => {
      canvas.clear();
      if (revision) {
        canvas.select(0, revision);
      }
      if (path) {
        canvas.select(1, path);
        canvas.open("diff");
      } else canvas.close("diff");
    });
  });
  onMount(() => {
    const unsubscribe = controller.subscribe((value) => (snapshot = value));
    void (async () => {
      await controller.refresh(initialOperation);
      const first = initialRevision
        ? controller.state.commits.find(
            (commit) => commit.id === initialRevision,
          )
        : controller.state.commits[0];
      if (!first) return;
      await controller.selectRevision(first);
      if (controller.state.paths[0])
        await controller.selectPath(controller.state.paths[0].path);
      if (initialEvolution) {
        canvas.close("diff");
        openEvolution(first.id);
      }
    })().catch((error) => controller.feedback.report(error));
    return unsubscribe;
  });
</script>

<RepositoryShell>
  <section
    class="repository-panel"
    aria-label="Repository history"
    aria-busy={snapshot.busy}
  >
    <div class="repository-columns">
      <ColumnCanvas.Root
        controller={canvas}
        aria-label="Repository history columns"
      >
        <ColumnCanvas.Column
          id="revisions"
          columnTitle="JJ Log"
          aria-label="Revisions"
        >
          <RepositoryLogHeader
            {workspaces}
            {workspace}
            onWorkspaceSelect={(next) => {
              if (workspace === next) return;
              workspace = next;
              void controller.clearRevision();
            }}
            {copyText}
            nodes={operationNodes}
            title="JJ Log"
            count={snapshot.commits.length}
            {operations}
            operation={snapshot.operation}
            busy={snapshot.busy}
            onSelect={(operation) => controller.selectOperation(operation)}
            onRefresh={() => controller.refresh()}
          />
          <ColumnCanvas.Body>
            {#if snapshot.phase === "loading"}<RepositorySkeleton
                label="Preparing repository history…"
              />
            {:else if snapshot.phase === "unavailable"}<p role="status">
                Repository history is unavailable for this vault. Refresh to try
                again.
              </p>
            {:else if !snapshot.headsReady}<RepositorySkeleton
                label="Loading repository operations…"
              />
            {:else if !snapshot.operation}<p role="status">
                {snapshot.heads.length > 1
                  ? "Choose an operation to inspect its history."
                  : "No repository operations available."}
              </p>
            {/if}

            {#if snapshot.snapshot}
              <RepositoryRevisions
                state={snapshot}
                {controller}
                {copyText}
                onOpenDiff={() => canvas.open("diff")}
                evolutionOpen={Boolean(evolutionAnchor)}
                onOpenEvolution={() => openEvolution(snapshot.revision?.id)}
                onResolveConflicts={() => (conflictsOpen = true)}
              />
            {/if}
          </ColumnCanvas.Body>
        </ColumnCanvas.Column>
        <RepositoryDiffColumn state={snapshot} {controller} />
        <ReviewEvolutionColumn
          nodes={evolutionNodes}
          anchor={evolutionAnchor}
          operation={snapshot.operation}
          baseCommits={snapshot.commits}
          onOpenDiff={() => canvas.open("evolution-diff")}
          onCloseDiff={() => canvas.close("evolution-diff")}
          onClose={() => (evolutionAnchor = undefined)}
          {copyText}
        />
      </ColumnCanvas.Root>
    </div>
  </section>
  {#snippet surface()}
    {#if snapshot.revision?.conflicted}
      {#key snapshot.revision.id}
        <ReviewConflictResolution
          open={conflictsOpen}
          commit={snapshot.revision}
          onClose={() => (conflictsOpen = false)}
        />
      {/key}
    {/if}
  {/snippet}
</RepositoryShell>

<style>
  .repository-panel {
    container: repository-history / inline-size;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--ui-workspace-view-background, var(--background));
    font-size: 0.875rem;
  }
  p {
    margin: 0;
    padding: 1rem;
  }
  .repository-columns {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
</style>
