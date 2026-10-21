<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import CheckIcon from "@lucide/svelte/icons/circle-check";
  import AlertIcon from "@lucide/svelte/icons/triangle-alert";
  import FolderIcon from "@lucide/svelte/icons/folder-open";
  import type { ImportState } from "../../../lib/ai/imports/state.svelte.ts";
  let {
    imports,
    canOpen = false,
  }: { imports: ImportState; canOpen?: boolean } = $props();
</script>

<footer class="ai-session-footer import-footer">
  <span class="ai-session-status" role="status">
    {#if imports.saved}<CheckIcon aria-hidden="true" />{imports.saved.duplicate
        ? "This snapshot is already saved."
        : "Snapshot saved locally."}
    {:else if imports.phase === "ready"}<CheckIcon
        aria-hidden="true"
      />{imports.cachedPreview
        ? "Cached preview · Ready to import"
        : "Snapshot verified · Ready to import"}
    {:else if imports.phase === "failed"}<AlertIcon aria-hidden="true" />Preview
      incomplete
    {:else if imports.phase === "reading"}<Spinner />{imports.paused
        ? "Reading paused"
        : "Reading session…"}
    {:else}<FolderIcon aria-hidden="true" />Select a session to preview{/if}
  </span>
  <Button
    size="xs"
    variant="ghost"
    disabled={imports.busy || imports.phase !== "ready" || !imports.plan}
    onclick={() => void imports.save()}
    ><DownloadIcon data-icon="inline-start" aria-hidden="true" />{imports.saved
      ? "Check saved snapshot"
      : "Import snapshot"}</Button
  >
  {#if imports.saved && canOpen}<Button
      size="xs"
      variant="ghost"
      disabled={imports.busy}
      onclick={() => void imports.open()}>Open saved snapshot</Button
    >{/if}
</footer>

<style>
  .import-footer .ai-session-status {
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
  }
  .import-footer .ai-session-status > :global(svg) {
    width: 0.875rem;
    height: 0.875rem;
    flex: none;
  }
</style>
