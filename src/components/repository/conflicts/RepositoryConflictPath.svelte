<script lang="ts">
  import { untrack } from "svelte";
  import type { LocalConflictDescriptor } from "@lapismd/jj-history";
  import RepositoryConflictText from "./RepositoryConflictText.svelte";
  let {
    conflict,
    draft,
    onChange,
  }: {
    conflict: LocalConflictDescriptor;
    draft?: string;
    onChange(content: string): void;
  } = $props();
  // This seed belongs to this mounted path; keystrokes must not rebuild the editor.
  const seed = untrack(
    () =>
      draft ??
      (conflict.editor.status === "text" ? conflict.editor.contents[1] : ""),
  );
</script>

<section class="store-conflict-path" aria-label={`Conflict ${conflict.path}`}>
  {#if conflict.editor.status === "text" && conflict.editor.contents.length === 3}
    <div class="store-conflict-path__editor">
      <RepositoryConflictText
        path={conflict.path}
        left={conflict.editor.contents[0]}
        base={seed}
        right={conflict.editor.contents[2]}
        editable
        onResolvedChange={({ content }) => onChange(content)}
      />
    </div>
  {:else}<p>Merge editor unavailable for this native conflict shape.</p>{/if}
</section>
