<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import FileCheck2Icon from "@lucide/svelte/icons/file-check-2";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import CheckIcon from "@lucide/svelte/icons/check";
  let {
    preview,
    resolution,
    selectedCount,
    pathCount,
    onDelete,
    onStage,
    onPreview,
    onBack,
  }: {
    preview: boolean;
    resolution?: "delete" | "uploaded_file";
    selectedCount: number;
    pathCount: number;
    onDelete(): void;
    onStage(): void;
    onPreview(): void;
    onBack(): void;
  } = $props();
</script>

<div
  class="store-conflict-editor__actions"
  role="group"
  aria-label="Conflict actions"
>
  {#if !preview}
    <Button
      type="button"
      size="sm"
      variant={resolution === "delete" ? "destructive" : "outline"}
      aria-label="Delete path"
      title="Delete path"
      aria-pressed={resolution === "delete"}
      onclick={onDelete}
    >
      <Trash2Icon data-icon="inline-start" aria-hidden="true" />
      <span class="store-conflict-editor__action-label">Delete path</span>
    </Button>
    {#if resolution === "uploaded_file"}
      <span class="store-conflict-editor__staged" role="status"
        >Merged file staged</span
      >
    {/if}
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-label="Stage merged file"
      title="Stage merged file"
      onclick={onStage}
    >
      <FileCheck2Icon data-icon="inline-start" aria-hidden="true" />
      <span class="store-conflict-editor__action-label">Stage merged file</span>
    </Button>
    <Button
      type="button"
      size="sm"
      disabled={selectedCount === 0}
      onclick={onPreview}
    >
      <EyeIcon data-icon="inline-start" aria-hidden="true" />Preview {selectedCount}/{pathCount}
    </Button>
  {:else}
    <Button type="button" size="sm" variant="outline" onclick={onBack}>
      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />Back
    </Button>
    <Button
      size="sm"
      disabled
      title="Native conflict commands are not connected in this preview"
    >
      <CheckIcon data-icon="inline-start" aria-hidden="true" />Apply resolution
    </Button>
  {/if}
</div>
