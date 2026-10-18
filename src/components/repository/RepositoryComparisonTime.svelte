<script lang="ts">
  import { onMount } from "svelte";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  let { timestamp }: { timestamp?: number } = $props();
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(timer);
  });
  const time = $derived(
    timestamp === undefined
      ? undefined
      : formatRelativeTime(timestamp, { now }),
  );
</script>

{#if time}<time datetime={time.datetime} title={time.full}>{time.text}</time
  >{/if}

<style>
  time {
    display: inline-flex;
    align-items: center;
    align-self: center;
    flex: none;
    margin-inline-start: auto;
    color: var(--muted-foreground);
    font-size: 0.75rem;
    line-height: 1;
    white-space: nowrap;
  }
</style>
