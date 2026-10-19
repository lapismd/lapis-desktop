<!-- Copied from jj-store StoreSettingsEmpty.svelte. -->
<script lang="ts">
  import type { Component } from "svelte";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  let {
    Icon,
    title,
    description,
  }: {
    Icon: Component;
    title: string;
    description: string;
  } = $props();
</script>

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon"><Icon aria-hidden="true" /></Empty.Media>
    <Empty.Title>{title}</Empty.Title>
    <Empty.Description>{description}</Empty.Description>
  </Empty.Header>
</Empty.Root>
