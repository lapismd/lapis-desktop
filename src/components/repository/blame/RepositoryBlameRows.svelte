<script lang="ts" generics="Row">
  import { createVirtualizer } from "@tanstack/svelte-virtual";
  import { get } from "svelte/store";
  import { untrack, type Snippet } from "svelte";
  let {
    rows,
    viewport,
    getKey,
    estimateSize,
    row,
  }: {
    rows: readonly Row[];
    viewport?: HTMLElement | null;
    getKey: (row: Row) => string;
    estimateSize: (row: Row | undefined) => number;
    row: Snippet<[Row]>;
  } = $props();
  const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
    count: 0,
    getScrollElement: () => viewport ?? null,
    getItemKey: (index) => getKey(rows[index]!),
    estimateSize: (index) => estimateSize(rows[index]),
    enabled: false,
    overscan: 2,
    useAnimationFrameWithResizeObserver: true,
  });
  $effect(() => {
    const nextRows = rows,
      nextViewport = viewport;
    untrack(() =>
      get(virtualizer).setOptions({
        count: nextRows.length,
        getScrollElement: () => nextViewport ?? null,
        getItemKey: (index) => getKey(nextRows[index]!),
        estimateSize: (index) => estimateSize(nextRows[index]),
        enabled: nextViewport != null,
        overscan: 2,
      }),
    );
  });
</script>

<div
  class="blame-virtual-rows"
  style:height={`${$virtualizer.getTotalSize()}px`}
>
  {#each $virtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
    {@const item = rows[virtualRow.index]}
    {#if item}
      <div class="blame-virtual-row" style:top={`${virtualRow.start}px`}>
        {@render row(item)}
      </div>
    {/if}
  {/each}
</div>

<style>
  .blame-virtual-rows {
    position: relative;
    width: 100%;
  }
  .blame-virtual-row {
    position: absolute;
    inset-inline: 0;
    width: 100%;
  }
</style>
