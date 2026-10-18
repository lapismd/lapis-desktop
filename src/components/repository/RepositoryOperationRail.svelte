<script lang="ts">
  import RepositoryAuthorAvatar from "./RepositoryAuthorAvatar.svelte";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import CornerLeftUpIcon from "@lucide/svelte/icons/corner-left-up";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import type { LocalGraphOperationNode } from "@lapismd/jj-history";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  let {
    operation,
    onSelect,
    copyText,
  }: {
    operation: LocalGraphOperationNode;
    onSelect(id: string): void;
    copyText(value: string): Promise<void>;
  } = $props();
</script>

<section class="operation-rail" aria-label="Selected operation metadata">
  <div class="operation-meta">
    <span>Author:</span>
    <RepositoryAuthorAvatar
      name={operation.user}
      handle={`${operation.user}@${operation.host}`}
      size="md"
    />
    <span title={`${operation.user}@${operation.host}`}>{operation.user}</span>
    <span aria-hidden="true">•</span>
    <RelativeTime timestamp={Number(operation.end.millis)} />
    <span aria-hidden="true">•</span>
    <RepositoryIdentifiers
      commitId={operation.id}
      commitLabel="operation ID"
      placement="inline"
      {copyText}
    />
  </div>
  <nav class="operation-parents" aria-label="Operation parents">
    <Tooltip.Provider delayDuration={0}>
      {#each operation.parents as parent (parent)}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                type="button"
                class="parent-pill"
                aria-label={`Inspect parent operation ${parent.slice(0, 8)}…${parent.slice(-4)} (${parent})`}
                onclick={() => onSelect(parent)}
              >
                <CornerLeftUpIcon aria-hidden="true" />
                <code>{parent.slice(0, 8)}…{parent.slice(-4)}</code>
              </button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="top" sideOffset={6}
            >Parent operation</Tooltip.Content
          >
        </Tooltip.Root>
      {:else}<p>Root operation</p>{/each}
    </Tooltip.Provider>
  </nav>
</section>

<style>
  .operation-rail {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--background);
  }
  .operation-meta {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    color: var(--muted-foreground);
    font-size: 0.875rem;
  }
  .operation-parents {
    display: flex;
    flex: none;
    min-width: 0;
    max-width: 50%;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
    margin-inline-start: auto;
  }
  .parent-pill {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    min-height: 1.65rem;
    gap: 0.35rem;
    padding: 0 0.45rem;
    border: 1px solid color-mix(in srgb, var(--foreground) 10%, transparent);
    border-radius: 0.4rem;
    color: var(--muted-foreground);
    background: color-mix(in srgb, var(--foreground) 7%, transparent);
    font: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
  }
  .parent-pill:hover,
  .parent-pill:focus-visible {
    border-color: color-mix(in srgb, var(--foreground) 18%, transparent);
    background: color-mix(in srgb, var(--foreground) 11%, transparent);
    color: var(--foreground);
  }
  .parent-pill :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
  .parent-pill code {
    min-width: 0;
    overflow: hidden;
    font-family: var(--font-mono, monospace);
    font-size: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  p {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--muted-foreground);
  }
</style>
