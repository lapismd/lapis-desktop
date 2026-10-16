<script lang="ts">
  import { onMount } from "svelte";
  import type {
    FileTextConflict,
    FileTextConflictRegistry,
    FileTextResolution,
  } from "@lapis-notes/api";

  let {
    registry,
    disabled = false,
  }: { registry: FileTextConflictRegistry; disabled?: boolean } = $props();
  let conflicts = $state<readonly FileTextConflict[]>([]);
  let busy = $state<string | null>(null);
  let error = $state("");

  onMount(() =>
    registry.subscribe((entries) => {
      conflicts = entries;
      if (!entries.length) error = "";
    }),
  );

  async function recover(
    conflict: FileTextConflict,
    choice?: FileTextResolution,
  ): Promise<void> {
    busy = conflict.id;
    error = "";
    try {
      if (choice === undefined) await conflict.refresh();
      else await conflict.resolve(choice);
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    } finally {
      busy = null;
    }
  }
</script>

{#if conflicts.length}
  <aside
    class="file-conflicts"
    aria-label="File conflicts"
    aria-busy={busy !== null}
  >
    <h2>Resolve file changes</h2>
    <p>Your drafts are kept until you choose which version to use.</p>
    {#if error}<p role="alert">{error}</p>{/if}
    {#each conflicts as conflict (conflict.id)}
      <section aria-label={`File conflict: ${conflict.path}`}>
        <h3>{conflict.path}</h3>
        <div class="versions">
          <label
            >Your version
            <textarea
              readonly
              rows="4"
              spellcheck="false"
              aria-label={`Your version of ${conflict.path}`}
              value={conflict.local}
            ></textarea>
          </label>
          <label
            >Disk version
            <textarea
              readonly
              rows="4"
              spellcheck="false"
              aria-label={`Disk version of ${conflict.path}`}
              value={conflict.external ?? ""}
            ></textarea>
          </label>
        </div>
        {#if conflict.external === undefined}
          <p role="status">
            The disk version could not be read: {conflict.readError}
          </p>
        {:else if conflict.external === null}
          <p>The file was deleted from disk.</p>
        {/if}
        <div class="actions">
          <button
            disabled={disabled ||
              busy !== null ||
              conflict.external === undefined}
            onclick={() => recover(conflict, "keep-local")}
            >Keep my version</button
          >
          <button
            disabled={disabled ||
              busy !== null ||
              conflict.external === undefined}
            onclick={() => recover(conflict, "use-external")}
            >Use disk version</button
          >
          <button
            disabled={disabled || busy !== null}
            onclick={() => recover(conflict)}>Check disk again</button
          >
        </div>
      </section>
    {/each}
  </aside>
{/if}

<style>
  .file-conflicts {
    flex: 0 1 auto;
    max-height: 50%;
    overflow: auto;
    padding: 1rem;
    border-bottom: 1px solid var(--ui-workspace-border);
    color: var(--ui-workspace-foreground);
    background: var(--ui-workspace-panel-background);
    font-size: 0.8125rem;
  }
  h2,
  h3,
  p {
    margin: 0 0 0.5rem;
  }
  h2 {
    font-size: 1rem;
  }
  h3 {
    font-size: inherit;
    overflow-wrap: anywhere;
  }
  section + section {
    margin-top: 1rem;
  }
  .versions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
    gap: 0.75rem;
  }
  label {
    display: grid;
    gap: 0.375rem;
    min-width: 0;
  }
  textarea {
    width: 100%;
    resize: vertical;
    padding: 0.5rem;
    border: 1px solid var(--ui-workspace-border);
    border-radius: 0.375rem;
    color: var(--ui-workspace-foreground);
    background: var(--ui-workspace-background);
    font: inherit;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  button {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--ui-workspace-border);
    border-radius: 0.375rem;
    color: var(--ui-workspace-foreground);
    background: var(--ui-workspace-background);
    font: inherit;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
  button:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--ui-workspace-foreground);
    outline-offset: 2px;
  }
</style>
