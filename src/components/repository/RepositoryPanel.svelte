<script lang="ts">
  import RepositoryConflictResolution from "./conflicts/RepositoryConflictResolution.svelte";
  import { repositoryWorkspaces } from "../../lib/repository/workspaces.ts";
  import { onMount, onDestroy, untrack } from "svelte";
  import * as ColumnCanvas from "@lapismd/design-core/shadcn/column-canvas";
  import { createLogCanvas } from "../../lib/repository/log-canvas.ts";
  import RepositoryLogHeader from "./RepositoryLogHeader.svelte";
  import type { HistoryController } from "../../lib/repository/history-controller.ts";
  import { initialHistoryState } from "../../lib/repository/history-state.ts";
  import RepositoryRevisions from "./RepositoryRevisions.svelte";
  import RepositoryDiffColumn from "./RepositoryDiffColumn.svelte";
  import RepositoryShell from "./RepositoryShell.svelte";
  import { openHistoryRevision } from "../../lib/repository/open-history-revision.ts";
  let {
    controller,
    initialOperation,
    initialRevision,
    initialLoad,
    copyText,
  }: {
    controller: HistoryController;
    initialOperation?: string;
    initialRevision?: string;
    initialLoad?: Promise<void>;
    copyText(value: string): Promise<void>;
  } = $props();
  let snapshot = $state(initialHistoryState());
  let conflictsOpen = $state(false);
  const selectionContext = $derived(
    `${snapshot.operation ?? ""}/${snapshot.revision?.id ?? ""}`,
  );
  $effect(() => {
    selectionContext;
    untrack(() => {
      conflictsOpen = false;
    });
  });
  const operations = $derived([
    ...new Set([
      ...snapshot.heads,
      ...(snapshot.operation ? [snapshot.operation] : []),
    ]),
  ]);
  const canvas = createLogCanvas();
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
    let mounted = true;
    const unsubscribe = controller.subscribe((value) => (snapshot = value));
    void (initialLoad ?? controller.refresh(initialOperation)).then(() => {
      if (mounted && initialRevision)
        return openHistoryRevision(controller, initialRevision);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
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
            {copyText}
            workspaces={repositoryWorkspaces(snapshot.commits)}
            workspace={snapshot.workspace}
            onWorkspaceSelect={(next) => void controller.selectWorkspace(next)}
            title="JJ Log"
            count={snapshot.commits.length}
            {operations}
            operation={snapshot.operation}
            busy={snapshot.busy}
            onSelect={(operation) => controller.selectOperation(operation)}
            onRefresh={() => controller.refresh()}
          />
          <ColumnCanvas.Body>
            {#if snapshot.phase === "loading"}<p role="status">
                Preparing repository history…
              </p>
            {:else if snapshot.phase === "unavailable"}<p role="status">
                Repository history is unavailable for this vault. Refresh to try
                again.
              </p>
            {:else if !snapshot.headsReady}<p role="status">
                Loading repository operations…
              </p>
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
                onResolveConflicts={() => (conflictsOpen = true)}
              />
            {/if}
          </ColumnCanvas.Body>
        </ColumnCanvas.Column>
        <RepositoryDiffColumn state={snapshot} {controller} />
      </ColumnCanvas.Root>
    </div>
  </section>
  {#snippet surface()}
    {#if snapshot.revision?.conflicted}
      {#key snapshot.revision.id}
        <RepositoryConflictResolution
          open={conflictsOpen}
          conflicts={snapshot.conflicts}
          ready={snapshot.conflictsReady}
          busy={snapshot.busy}
          onLoad={() => void controller.loadConflicts()}
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
