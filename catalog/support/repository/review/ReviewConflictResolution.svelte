<script lang="ts">
  import { untrack } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import ReviewConflictSurface from "../../../../src/components/repository/conflicts/RepositoryConflictSurface.svelte";
  import ReviewConflictActions from "../../../../src/components/repository/conflicts/RepositoryConflictActions.svelte";
  import ReviewConflictText from "../../../../src/components/repository/conflicts/RepositoryConflictText.svelte";
  import { conflictFile } from "./review-conflict-fixture.ts";
  let {
    open,
    commit,
    onClose,
  }: {
    open: boolean;
    commit: LocalGraphCommit;
    onClose(): void;
  } = $props();
  let browserOpen = $state(true);
  const compact = new MediaQuery("(max-width: 700px)");
  $effect(() => {
    if (compact.current) browserOpen = false;
  });
  let draft = $state(conflictFile.base);
  let staged = $state<string>();
  let deleted = $state(false);
  let preview = $state(false);
  let editorSeed = $state(conflictFile.base);
  const selectedCount = $derived(staged !== undefined || deleted ? 1 : 0);
  $effect(() => {
    if (open) editorSeed = untrack(() => draft);
  });
</script>

<ReviewConflictSurface
  {open}
  label="Resolve native conflicts"
  busy={false}
  locked={preview}
  bind:browserOpen
  compact={compact.current}
  files={[{ path: conflictFile.path }]}
  activePath={conflictFile.path}
  onSelect={() => {
    if (compact.current) browserOpen = false;
  }}
  {onClose}
>
  {#snippet actions()}
    <ReviewConflictActions
      {preview}
      {selectedCount}
      pathCount={1}
      resolution={deleted
        ? "delete"
        : staged !== undefined
          ? "uploaded_file"
          : undefined}
      onDelete={() => {
        deleted = !deleted;
        staged = undefined;
      }}
      onStage={() => {
        staged = draft;
        deleted = false;
      }}
      onPreview={() => {
        if (selectedCount) preview = true;
      }}
      onBack={() => {
        editorSeed = draft;
        preview = false;
      }}
    />
  {/snippet}
  {#if preview}
    <section
      class="store-conflict-preview"
      aria-label="Conflict resolution preview"
    >
      <h2>Prepared resolution</h2>
      <p>
        {deleted ? "Delete" : "Replace"}
        {conflictFile.path} for {commit.description.split("\n")[0]}.
      </p>
      {#if !deleted}<pre><code>{staged}</code></pre>{/if}
      <p>
        Storybook preview. Native apply is unavailable; this draft has not been
        saved to the repository.
      </p>
    </section>
  {:else}
    <div class="store-conflict-editor__path">
      <section
        class="store-conflict-path"
        aria-label={`Conflict ${conflictFile.path}`}
      >
        <div class="store-conflict-path__editor">
          <ReviewConflictText
            path={conflictFile.path}
            left={conflictFile.left}
            base={editorSeed}
            right={conflictFile.right}
            editable
            onResolvedChange={({ content }) => {
              draft = content;
              if (staged !== undefined && staged !== content)
                staged = undefined;
            }}
          />
        </div>
      </section>
    </div>
  {/if}
</ReviewConflictSurface>
