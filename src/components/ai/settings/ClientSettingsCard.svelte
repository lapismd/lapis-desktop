<!-- Adapted from jj-store StoreSettingsCard.svelte. -->
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
  style="--card-spacing: 0"
  class="store-settings-card"
  role="region"
  aria-labelledby={id}
>
  <Card.Header class="store-settings-card__header">
    <Card.Title
      ><span {id}
        >{#if Icon}<Icon aria-hidden="true" />{/if}{title}</span
      ></Card.Title
    >
    {#if description}<Card.Description>{description}</Card.Description>{/if}
  </Card.Header>
  <Card.Content class="store-settings-card__content"
    >{@render children()}</Card.Content
  >
</Card.Root>
