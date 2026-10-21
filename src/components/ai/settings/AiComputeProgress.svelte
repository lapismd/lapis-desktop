<script lang="ts">
  import { Progress } from "@lapismd/design-core/shadcn/progress";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import type { ComputeProgress } from "../../../lib/ai/settings/compute.svelte.ts";
  let { progress }: { progress: ComputeProgress } = $props();
  const downloaded = $derived(progress.downloaded_bytes);
  const total = $derived(progress.total_bytes);
  const percent = $derived(
    typeof total === "number" && total > 0 && typeof downloaded === "number"
      ? Math.min(100, Math.max(0, Math.round((downloaded / total) * 100)))
      : null,
  );
  const label = $derived(
    (
      {
        prepare: "Preparing runtime",
        download: "Downloading weights",
        start: "Starting model",
        import: "Importing weights",
        remove: "Removing weights",
      } as Record<string, string>
    )[progress.action ?? ""] ?? "Preparing model",
  );
  function bytes(value: number) {
    return value >= 1e9
      ? `${(value / 1e9).toFixed(2)} GB`
      : `${(value / 1e6).toFixed(1)} MB`;
  }
</script>

<section
  class="compute-progress"
  aria-label="Compute progress"
  aria-live="polite"
>
  <div class="heading">
    <span><Spinner aria-hidden="true" />{label}</span><span
      >{percent !== null ? `${percent}%` : "In progress"}</span
    >
  </div>
  {#if progress.label}<p>{progress.label}</p>{/if}
  {#if progress.file}<p class="file">{progress.file}</p>{/if}
  {#if percent !== null}<Progress
      value={percent}
      aria-label={progress.file ? "Current file download progress" : label}
    />{/if}
  {#if typeof downloaded === "number"}<p>
      {bytes(downloaded)}{typeof total === "number" && total > 0
        ? ` of ${bytes(total)}`
        : " downloaded"}{progress.file && percent !== null
        ? " · current file"
        : ""}
    </p>{/if}
</section>

<style>
  .compute-progress {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--muted);
    border-radius: var(--radius);
    min-width: 0;
  }
  .heading,
  .heading > span:first-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .heading {
    justify-content: space-between;
    font-size: 0.875rem;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }
  .file {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
