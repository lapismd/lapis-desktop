<script lang="ts">
  // Adapted from jj-store StoreSettingsCard/Heading/Footer (Apache-2.0).
  import type { Component, Snippet } from "svelte";
  import * as Card from "@lapismd/design-core/shadcn/card";
  let {
    title,
    description,
    Icon,
    icon,
    actions,
    footer,
    children,
    padded = true,
  }: {
    title: string;
    description?: string;
    Icon?: Component;
    icon?: Snippet;
    actions?: Snippet;
    footer?: Snippet;
    children: Snippet;
    padded?: boolean;
  } = $props();
</script>

<Card.Root
  size="sm"
  style="gap:0;padding:0;overflow:hidden;background:var(--background)"
>
  <div class="backup-card-header">
    <Card.Header style="padding:0;display:flex;align-items:center;gap:.75rem">
      {#if Icon || icon}<span class="backup-card-icon" aria-hidden="true">
          {#if Icon}<Icon />{:else}{@render icon?.()}{/if}
        </span>{/if}
      <div class="backup-card-heading">
        <Card.Title>{title}</Card.Title>
        {#if description}<Card.Description>{description}</Card.Description>{/if}
      </div>
      {@render actions?.()}
    </Card.Header>
  </div>
  <Card.Content
    style={`padding:${padded ? ".85rem 1rem" : "0"};min-width:0;background:var(--background)`}
    >{@render children()}</Card.Content
  >
  {#if footer}<Card.Footer
      style="padding:.85rem 1rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;background:var(--background)"
    >
      {@render footer()}
    </Card.Footer>{/if}
</Card.Root>

<style>
  .backup-card-header {
    padding: 0.85rem 1rem;
    background: color-mix(in srgb, var(--muted) 35%, var(--card));
    border-bottom: 1px solid var(--border);
  }
  .backup-card-heading {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 0.25rem;
  }
  .backup-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--muted) 60%, transparent);
  }
  .backup-card-icon :global(svg) {
    width: 1.2rem;
    height: 1.2rem;
  }
</style>
