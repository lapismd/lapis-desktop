<script lang="ts">
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  let { path }: { path?: string } = $props();
</script>

<span class="repository-review-file-title">
  {#if path}<FileTextIcon aria-hidden="true" />{/if}
  <span title={path}>{path ?? "Diff"}</span>
</span>

<style>
  .repository-review-file-title {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .repository-review-file-title :global(svg) {
    flex: none;
    width: 0.875rem;
    height: 0.875rem;
    color: var(--muted-foreground);
  }
  .repository-review-file-title > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
