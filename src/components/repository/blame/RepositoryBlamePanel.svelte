<script lang="ts">
  import RepositorySkeleton from "../RepositorySkeleton.svelte";
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import WrapTextIcon from "@lucide/svelte/icons/wrap-text";
  import { Toggle } from "@lapismd/design-core/shadcn/toggle";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import {
    readBlameWrap,
    saveBlameWrap,
  } from "../../../lib/repository/blame-preferences.ts";
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
    commitStats,
  }: {
    controller: BlameController;
    copyText(value: string): Promise<void>;
    onOpen(commit: string): void;
    commitStats?: Readonly<
      Record<string, { additions: number; deletions: number }>
    >;
  } = $props();
  let viewState = $state<BlameState>({ status: "loading", busy: false });
  let wrap = $state(readBlameWrap());
  onMount(() =>
    controller.subscribe((value) => {
      viewState = value;
    }),
  );
</script>

<RepositoryShell>
  <section
    class="blame-panel"
    aria-label="File blame"
    aria-busy={viewState.busy}
  >
    <header>
      <span class="file-title"
        ><RepositoryFileTitle path={viewState.selection?.path} /></span
      >
      <RepositoryIdentifiers
        {copyText}
        commitId={viewState.selection?.commit}
        changeId={encodeJjChangeId(
          viewState.progress?.commits[viewState.selection?.commit ?? ""]
            ?.change_id ?? "",
        )}
        placement="inline"
      />
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Toggle
                {...props}
                pressed={wrap}
                onPressedChange={(pressed) => {
                  wrap = pressed;
                  saveBlameWrap(pressed);
                }}
                size="sm"
                class="wrap-toggle"
                aria-label="Wrap text"
                ><WrapTextIcon aria-hidden="true" /></Toggle
              >
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content role="tooltip">Wrap text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Refresh blame"
        disabled={viewState.busy}
        onclick={() => controller.refresh()}><RefreshCwIcon /></Button
      >
    </header>
    {#if viewState.status === "failed"}<p role="status">
        Blame is unavailable. Refresh to try again.
      </p>{/if}
    <div class="blame-body">
      {#if viewState.contents === undefined && viewState.busy}<RepositorySkeleton
          kind="blame"
          label="Loading file blame…"
        />
      {:else if viewState.contents !== undefined}
        <RepositoryBlameView
          contents={viewState.contents}
          path={viewState.selection?.path ?? ""}
          view={viewState}
          {onOpen}
          {commitStats}
          {wrap}
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
  header :global(.wrap-toggle) {
    width: 1.75rem;
    min-width: 1.75rem;
    height: 1.75rem;
    padding: 0;
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
