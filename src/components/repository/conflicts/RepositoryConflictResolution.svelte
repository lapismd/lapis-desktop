<script lang="ts">
  import { untrack } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import type { LocalConflictDescriptor } from "@lapismd/jj-history";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RepositoryConflictSurface from "./RepositoryConflictSurface.svelte";
  import RepositoryConflictActions from "./RepositoryConflictActions.svelte";
  import RepositoryConflictPath from "./RepositoryConflictPath.svelte";
  let {
    open,
    conflicts,
    ready,
    busy,
    onLoad,
    onClose,
  }: {
    open: boolean;
    conflicts: readonly LocalConflictDescriptor[];
    ready: boolean;
    busy: boolean;
    onLoad(): void;
    onClose(): void;
  } = $props();
  const compact = new MediaQuery("(max-width: 700px)");
  let browserOpen = $state(true),
    activePath = $state("");
  let drafts = $state<Record<string, string>>({});
  let staged = $state<
    Record<string, { type: "delete" } | { type: "uploaded_file"; text: string }>
  >({});
  let preview = $state(false);
  let requested = $state(false);
  const active = $derived(
    conflicts.find((c) => c.path === activePath) ?? conflicts[0],
  );
  const selected = $derived(active ? staged[active.path] : undefined);
  $effect(() => {
    if (compact.current) browserOpen = false;
  });
  $effect(() => {
    if (open && !requested) {
      requested = true;
      untrack(() => onLoad());
    }
  });
  function stage() {
    if (active?.editor.status !== "text") return;
    staged[active.path] = {
      type: "uploaded_file",
      text: drafts[active.path] ?? active.editor.contents[1] ?? "",
    };
  }
</script>

<RepositoryConflictSurface
  {open}
  label="Resolve native conflicts"
  {busy}
  locked={busy || preview}
  bind:browserOpen
  compact={compact.current}
  files={conflicts}
  activePath={active?.path ?? ""}
  onSelect={(path) => {
    activePath = path;
    if (compact.current) browserOpen = false;
  }}
  {onClose}
>
  {#snippet actions()}
    {#if ready && active}<RepositoryConflictActions
        {preview}
        resolution={selected?.type}
        selectedCount={Object.keys(staged).length}
        pathCount={conflicts.length}
        onDelete={() => {
          if (!active) return;
          if (selected?.type === "delete") delete staged[active.path];
          else staged[active.path] = { type: "delete" };
        }}
        onStage={stage}
        onPreview={() => {
          if (Object.keys(staged).length) preview = true;
        }}
        onBack={() => (preview = false)}
      />{/if}
  {/snippet}
  {#if !ready}
    <p role="status">
      {busy
        ? "Loading native conflict details…"
        : "Conflict details are unavailable."}
    </p>
    {#if !busy}<Button variant="outline" size="sm" onclick={onLoad}
        >Retry conflict details</Button
      >{/if}
  {:else if !conflicts.length}<p>
      No conflict descriptors are available for this revision.
    </p>
  {:else if preview}
    <section
      class="store-conflict-preview"
      aria-label="Conflict resolution preview"
    >
      <h2>Resolution draft</h2>
      {#each Object.entries(staged) as [path, resolution] (path)}
        <p>{resolution.type === "delete" ? "Delete" : "Replace"} {path}</p>
        {#if resolution.type === "uploaded_file"}<pre><code
              >{resolution.text}</code
            ></pre>{/if}
      {/each}
      <p>
        Draft retained locally while this revision stays selected. Applying
        repository changes is unavailable in this read-only plugin.
      </p>
    </section>
  {:else if active}
    <div class="store-conflict-editor__path">
      {#key active.path}<RepositoryConflictPath
          conflict={active}
          draft={drafts[active.path]}
          onChange={(content) => {
            drafts[active.path] = content;
            const current = staged[active.path];
            if (current?.type === "uploaded_file" && current.text !== content)
              delete staged[active.path];
          }}
        />{/key}
    </div>
  {/if}
</RepositoryConflictSurface>
