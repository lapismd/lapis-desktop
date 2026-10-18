<script lang="ts">
  import { onMount } from "svelte";
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { formatRelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import RepositoryAuthorAvatar from "./RepositoryAuthorAvatar.svelte";
  let {
    target,
    operation,
  }: { target: string; operation?: LocalGraphOperationNode } = $props();
  let now = $state(Date.now());
  onMount(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, 30_000);
    return () => clearInterval(timer);
  });
  const time = $derived(
    operation
      ? formatRelativeTime(Number(operation.end.millis), { now })
      : undefined,
  );
</script>

<div class="operation-target">
  <RepositoryAuthorAvatar name={operation?.user ?? "Unknown author"} />
  <div class="operation-target-body">
    <span class="operation-target-description" title={operation?.description}>
      {operation?.description.split("\n")[0] ||
        (target ? "Parent details unavailable" : "Choose a parent")}
    </span>
    <div class="operation-target-metadata">
      {#if operation}<span title={`${operation.user}@${operation.host}`}
          >{operation.user}@{operation.host}</span
        >{/if}
      {#if time}<time datetime={time.datetime} title={time.full}
          >{time.text}</time
        >{/if}
      {#if operation?.workspace}<Badge variant="secondary"
          >{operation.workspace}</Badge
        >{/if}
      {#if operation?.is_snapshot}<Badge variant="secondary">Snapshot</Badge
        >{/if}
    </div>
    {#if target}<span
        class="operation-target-id"
        title={`Operation ID ${target}`}
      >
        <Badge variant="secondary">OP</Badge><code
          >{target.slice(0, 12)}…{target.slice(-4)}</code
        >
      </span>{/if}
  </div>
</div>

<style>
  .operation-target {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    width: 100%;
    min-width: 0;
    gap: 0.5rem;
    text-align: start;
    color: inherit;
  }
  .operation-target-body {
    display: grid;
    min-width: 0;
    gap: 0.15rem;
  }
  .operation-target-description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.875rem;
    font-weight: 550;
  }
  .operation-target-metadata {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
  .operation-target-metadata > span {
    overflow-wrap: anywhere;
  }
  .operation-target-id {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
  }
  time {
    white-space: nowrap;
  }
</style>
