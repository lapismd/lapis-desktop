<script lang="ts">
  import { MergeEditor } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import FileCheckIcon from "@lucide/svelte/icons/file-check";
  import HardDriveDownloadIcon from "@lucide/svelte/icons/hard-drive-download";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import type {
    ConflictReviewState,
    ConflictSelection,
  } from "./conflict-review-state.svelte.ts";

  let {
    model,
    selection,
  }: { model: ConflictReviewState; selection: ConflictSelection } = $props();
  const conflict = $derived(
    model.entries.find((entry) => entry.path === selection.path),
  );
  const disabled = $derived(model.disabled() || model.busy !== null);
</script>

{#if conflict}
  <section
    class="conflict-review"
    aria-label={`File conflict: ${conflict.path}`}
    aria-busy={model.busy === conflict.path}
  >
    <div class="comparison">
      <MergeEditor
        path={conflict.path}
        left={conflict.local}
        base={conflict.baseline ?? ""}
        right={conflict.external ?? ""}
        leftLabel="Your version"
        baseLabel="Last saved version"
        rightLabel="Disk version"
        readOnly
      />
    </div>
    <footer>
      <div class="explanation">
        {#if model.error}<p role="alert">{model.error}</p>{/if}
        {#if conflict.external === undefined}
          <p role="status">
            The disk version could not be read: {conflict.readError}
          </p>
        {:else if conflict.external === null}
          <p>The file was deleted from disk.</p>
        {:else}
          <p>Your draft is kept until you choose which version to use.</p>
        {/if}
      </div>
      <div class="actions">
        <Button
          variant="outline"
          disabled={disabled || conflict.external === undefined}
          onclick={() => model.recover(conflict.path, "keep-local")}
        >
          <FileCheckIcon aria-hidden="true" />Keep my version
        </Button>
        <Button
          variant="outline"
          disabled={disabled || conflict.external === undefined}
          onclick={() => model.recover(conflict.path, "use-external")}
        >
          <HardDriveDownloadIcon aria-hidden="true" />Use disk version
        </Button>
        <Button
          variant="ghost"
          {disabled}
          onclick={() => model.recover(conflict.path)}
        >
          <RefreshCwIcon aria-hidden="true" />Check disk again
        </Button>
      </div>
    </footer>
  </section>
{/if}

<style>
  .conflict-review {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    color: var(--ui-workspace-view-foreground, var(--foreground));
    background: var(--ui-workspace-view-background, var(--background));
  }
  .comparison {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--ui-workspace-border);
    background: var(--ui-workspace-background, var(--background));
  }
  .explanation {
    flex: 1;
    min-width: 12rem;
    font-size: 0.8125rem;
  }
  p {
    margin: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  [role="alert"] {
    color: var(--destructive);
  }
</style>
