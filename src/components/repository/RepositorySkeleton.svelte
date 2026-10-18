<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  let {
    kind = "log",
    label = "Loading repository history",
  }: {
    kind?:
      | "log"
      | "file-history"
      | "files"
      | "diff"
      | "operation"
      | "blame"
      | "conflicts";
    label?: string;
  } = $props();
  const widths = ["72%", "54%", "86%", "61%", "78%", "48%"];
</script>

<div
  class="repository-skeleton"
  data-skeleton={kind}
  role="status"
  aria-label={label}
>
  <span class="loading-label">{label}</span>
  <div aria-hidden="true">
    {#if kind === "operation"}
      <div class="metadata">
        <Skeleton style="width:75%;height:1.1rem" /><Skeleton
          style="width:45%;height:0.75rem"
        />
      </div>
    {/if}
    {#if kind === "blame" || kind === "diff" || kind === "conflicts"}
      <div
        class="source-columns"
        class:blame={kind === "blame"}
        class:conflicts={kind === "conflicts"}
      >
        {#each Array(kind === "conflicts" ? 3 : 2) as _, column (column)}
          <div class="source-pane">
            {#each Array(12) as _, row (row)}
              <div class="source-line">
                <Skeleton style="width:1.25rem;height:0.625rem" />
                <Skeleton
                  style={`width:${widths[(row + column) % widths.length]};height:0.625rem`}
                />
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {:else}
      {#each Array(kind === "files" || kind === "operation" ? 4 : 6) as _, row (row)}
        <div
          class="skeleton-row"
          class:compact={kind === "files" || kind === "operation"}
        >
          {#if kind === "log"}<Skeleton
              style="width:1.75rem;height:1.75rem;border-radius:999px"
            />
          {:else}<Skeleton style="width:0.75rem;height:0.75rem" />{/if}
          <div class="row-body">
            <Skeleton
              style={`width:${widths[row % widths.length]};height:0.75rem`}
            />
            {#if kind !== "files"}<Skeleton
                style="width:38%;height:0.625rem"
              />{/if}
          </div>
          {#if kind === "log" || kind === "file-history"}<Skeleton
              style="width:4.5rem;height:1.25rem"
            />{/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .repository-skeleton {
    padding: 0.75rem;
    min-width: 0;
  }
  .loading-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 4.5rem;
  }
  .skeleton-row.compact {
    min-height: 2rem;
  }
  .row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .source-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .source-columns.blame {
    grid-template-columns: min(22rem, 45%) minmax(0, 1fr);
    gap: 0;
  }
  .source-columns.conflicts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .source-pane + .source-pane {
    border-left: 1px solid var(--border);
    padding-left: 0.75rem;
  }
  .source-line {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    height: 28px;
  }
  .metadata {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-block: 0.5rem 1rem;
  }
</style>
