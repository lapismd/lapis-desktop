<script lang="ts" generics="Row">
  import {
    createVirtualizer,
    type VirtualItem,
  } from "@tanstack/svelte-virtual";
  import { get } from "svelte/store";
  import { onDestroy, untrack, type Snippet } from "svelte";
  let {
    rows,
    viewport,
    getKey,
    estimateSize,
    row,
    layoutKey,
  }: {
    rows: readonly Row[];
    viewport?: HTMLElement | null;
    getKey: (row: Row) => string;
    estimateSize: (row: Row | undefined) => number;
    row: Snippet<[Row]>;
    layoutKey: boolean;
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
  let visibleRows = $state.raw<VirtualItem[]>([]);
  let totalSize = $state(0);
  // Keep measurement notifications attached to the pane, not a row effect.
  const unsubscribe = untrack(() =>
    virtualizer.subscribe((instance) => {
      visibleRows = instance.getVirtualItems();
      totalSize = instance.getTotalSize();
    }),
  );
  onDestroy(unsubscribe);
  const instance = get(virtualizer);
  let list = $state<HTMLDivElement>();
  function resizeRow(node: HTMLDivElement) {
    instance.resizeItem(
      Number(node.dataset.index),
      Math.round(node.getBoundingClientRect().height),
    );
  }
  function measureRow(node: HTMLDivElement) {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resizeRow(node));
    });
    observer.observe(node);
    resizeRow(node);
    return {
      destroy() {
        cancelAnimationFrame(frame);
        observer.disconnect();
      },
    };
  }
  $effect(() => {
    const nextRows = rows,
      nextViewport = viewport;
    untrack(() =>
      instance.setOptions({
        count: nextRows.length,
        getScrollElement: () => nextViewport ?? null,
        getItemKey: (index) => getKey(nextRows[index]!),
        estimateSize: (index) => estimateSize(nextRows[index]),
        enabled: nextViewport != null,
        overscan: 2,
      }),
    );
  });
  $effect(() => {
    void rows;
    void layoutKey;
    const node = viewport,
      host = list;
    if (!node || !host) return;
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        instance.measure();
        for (const row of host.querySelectorAll<HTMLDivElement>(
          "[data-blame-row]",
        ))
          resizeRow(row);
      });
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(node);
    remeasure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });
</script>

<div
  bind:this={list}
  class="blame-virtual-rows"
  style:height={`${totalSize}px`}
>
  {#each visibleRows as virtualRow (virtualRow.key)}
    {@const item = rows[virtualRow.index]}
    {#if item}
      <div
        class="blame-virtual-row"
        style:top={`${virtualRow.start}px`}
        data-blame-row
        data-index={virtualRow.index}
        use:measureRow
      >
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
