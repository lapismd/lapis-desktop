<script lang="ts">
  import RepositorySkeleton from "../RepositorySkeleton.svelte";
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import type { BlameController } from "../../../lib/repository/blame-controller.ts";
  import type { BlameState } from "../../../lib/repository/blame-model.ts";
  import RepositoryBlameView from "./RepositoryBlameView.svelte";
  import RepositoryFileTitle from "../RepositoryFileTitle.svelte";
  import RepositoryIdentifiers from "../RepositoryIdentifiers.svelte";
  import { encodeJjChangeId } from "../../../lib/repository/graph/repository-log-graph.ts";
  import RepositoryShell from "../RepositoryShell.svelte";
  let {
    controller,
    copyText,
    onOpen,
  }: {
    controller: BlameController;
    copyText(value: string): Promise<void>;
    onOpen(commit: string): void;
  } = $props();
  let state = $state<BlameState>({ status: "loading", busy: false });
  onMount(() =>
    controller.subscribe((value) => {
      state = value;
    }),
  );
</script>

<RepositoryShell>
  <section class="blame-panel" aria-label="File blame" aria-busy={state.busy}>
    <header>
      <strong>Blame</strong>
      <span class="file-title"
        ><RepositoryFileTitle path={state.selection?.path} /></span
      >
      <RepositoryIdentifiers
        {copyText}
        commitId={state.selection?.commit}
        changeId={encodeJjChangeId(
          state.progress?.commits[state.selection?.commit ?? ""]?.change_id ??
            "",
        )}
        placement="inline"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh blame"
        disabled={state.busy}
        onclick={() => controller.refresh()}><RefreshCwIcon /></Button
      >
    </header>
    <div class="pin" title={state.selection?.operation}>
      Operation {state.selection?.operation.slice(0, 8)}…
    </div>
    {#if state.status === "failed"}<p role="status">
        Blame is unavailable. Refresh to try again.
      </p>{/if}
    <div class="blame-body">
      {#if state.contents === undefined && state.busy}<RepositorySkeleton
          kind="blame"
          label="Loading file blame…"
        />
      {:else if state.contents !== undefined}
        <RepositoryBlameView
          contents={state.contents}
          path={state.selection?.path ?? ""}
          view={state}
          {onOpen}
        />
      {/if}
    </div>
  </section>
</RepositoryShell>

<style>
  .blame-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    font-size: 0.875rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .file-title {
    flex: 1;
    min-width: 0;
  }
  .pin {
    display: flex;
    gap: 1rem;
    padding: 0.375rem 0.75rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  p {
    padding: 0.75rem;
    margin: 0;
    color: var(--muted-foreground);
  }
  .blame-body {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
</style>
