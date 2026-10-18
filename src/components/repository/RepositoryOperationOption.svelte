<script lang="ts">
  import { onDestroy } from "svelte";
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import CheckIcon from "@lucide/svelte/icons/check";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import RepositoryParentSummary from "./RepositoryParentSummary.svelte";
  import RepositoryComparisonTime from "./RepositoryComparisonTime.svelte";
  let {
    target,
    operation,
    fallbackDescription,
    copyText,
  }: {
    target: string;
    operation?: LocalGraphOperationNode;
    fallbackDescription?: string;
    copyText(value: string): Promise<void>;
  } = $props();
  let feedback = $state<"" | "copied" | "failed">("");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request = 0,
    destroyed = false;
  function reset() {
    clearTimeout(timer);
    request++;
    feedback = "";
  }
  $effect(() => {
    void target;
    reset();
  });
  onDestroy(() => {
    destroyed = true;
    reset();
  });
  async function copy() {
    const current = ++request;
    clearTimeout(timer);
    let result: "copied" | "failed";
    try {
      await copyText(target);
      result = "copied";
    } catch {
      result = "failed";
    }
    if (destroyed || current !== request) return;
    feedback = result;
    timer = setTimeout(() => (feedback = ""), 1_500);
  }
</script>

<div
  role="gridcell"
  class="repository-review-operation-option"
  title={[
    operation?.workspace ? `Workspace ${operation.workspace}` : "",
    operation?.is_snapshot ? "Snapshot" : "",
    operation ? `${operation.user}@${operation.host}` : "",
  ]
    .filter(Boolean)
    .join(" · ")}
>
  <RepositoryParentSummary
    {target}
    author={operation?.user}
    handle={operation ? `${operation.user}@${operation.host}` : undefined}
    description={operation?.description ?? fallbackDescription}
  />
  <button
    type="button"
    class="repository-review-operation-id"
    data-copy-feedback={feedback || undefined}
    aria-label={`${feedback === "copied" ? "Copied" : feedback === "failed" ? "Retry copying" : "Copy"} operation ID ${target}; OP ${feedback ? (feedback === "copied" ? "Copied" : "Retry") : `${target.slice(0, 8)}…${target.slice(-4)}`}`}
    title={target}
    onpointerdown={(event) => event.stopPropagation()}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    }}
    onclick={(event) => {
      event.stopPropagation();
      void copy();
    }}
  >
    <span class="repository-id-chip" aria-hidden="true">OP</span>
    {#if feedback === "copied"}<CheckIcon aria-hidden="true" />
    {:else if feedback === "failed"}<TriangleAlertIcon
        aria-hidden="true"
      />{/if}
    <code
      >{feedback
        ? feedback === "copied"
          ? "Copied"
          : "Retry"
        : `${target.slice(0, 8)}…${target.slice(-4)}`}</code
    >
  </button>
  <span class="copy-status" role="status" aria-live="polite">
    {feedback === "copied"
      ? "Copied operation ID."
      : feedback === "failed"
        ? "Could not copy operation ID."
        : ""}
  </span>
  <RepositoryComparisonTime
    timestamp={operation ? Number(operation.end.millis) : undefined}
  />
</div>

<style>
  .repository-review-operation-option {
    display: flex;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    flex: 1 1 0;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  .repository-review-operation-id {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    height: 1.575rem;
    gap: 0.25rem;
    padding: 0 0.3125rem;
    border: 1px solid var(--border);
    border-radius: 0.45rem;
    color: var(--foreground);
    background: color-mix(in srgb, currentcolor 4%, var(--background));
    font-family: var(--font-mono, monospace);
    font-size: 0.5625rem;
    font-weight: 500;
    line-height: 1rem;
    cursor: pointer;
  }
  .repository-review-operation-id code {
    height: 1rem;
    font-family: inherit;
    font-size: 0.6875rem;
    line-height: 1rem;
  }
  .repository-review-operation-id .repository-id-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 1rem;
    padding: 0 0.25em;
    border: 0;
    border-radius: 0.28rem;
    background: color-mix(in srgb, currentcolor 7%, transparent);
    font-family: inherit;
    font-size: 0.5625rem;
    font-weight: 600;
    line-height: 1rem;
  }
  .repository-review-operation-id :global(svg) {
    width: 0.625rem;
    height: 0.625rem;
  }
  .repository-review-operation-id:hover {
    background: color-mix(in srgb, var(--foreground) 9%, var(--background));
  }
  .repository-review-operation-id:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .repository-review-operation-id[data-copy-feedback="copied"] {
    color: color-mix(in srgb, #16a34a 70%, var(--foreground));
    background: color-mix(in srgb, #16a34a 14%, var(--background));
  }
  .repository-review-operation-id[data-copy-feedback="failed"] {
    color: var(--destructive);
  }
  .copy-status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
