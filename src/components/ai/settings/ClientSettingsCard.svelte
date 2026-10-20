<!-- Adapted from Repository History BackupCard and jj-store StoreSettingsCard. -->
<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import "./agent-clients.css";
  let {
    id,
    title,
    description,
    Icon,
    children,
  }: {
    id: string;
    title: string;
    description?: string;
    Icon?: Component;
    children: Snippet;
  } = $props();
</script>

<Card.Root
  size="sm"
  style="gap:0;padding:0;overflow:hidden;background:var(--background)"
  class="store-settings-card"
  role="region"
  aria-labelledby={id}
>
  <div class="store-settings-card__header">
    <Card.Header style="padding:0;display:flex;align-items:center;gap:.75rem">
      {#if Icon}<span class="store-settings-card__icon" aria-hidden="true">
          <Icon />
        </span>{/if}
      <div class="store-settings-card__heading">
        <Card.Title><span {id}>{title}</span></Card.Title>
        {#if description}<Card.Description>{description}</Card.Description>{/if}
      </div>
    </Card.Header>
  </div>
  <Card.Content class="store-settings-card__content"
    >{@render children()}</Card.Content
  >
</Card.Root>
