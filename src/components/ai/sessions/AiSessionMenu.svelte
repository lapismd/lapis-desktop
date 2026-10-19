<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import MoreIcon from "@lucide/svelte/icons/ellipsis";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import ExternalIcon from "@lucide/svelte/icons/arrow-up-right";
  let {
    busy,
    unavailable = false,
    refreshLabel,
    onRefresh,
    onOpen,
  }: {
    busy: boolean;
    unavailable?: boolean;
    refreshLabel: string;
    onRefresh: () => void;
    onOpen?: () => void;
  } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}<Button
        {...props}
        variant="ghost"
        size="icon-sm"
        aria-label="Session actions"><MoreIcon aria-hidden="true" /></Button
      >{/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Item disabled={busy || unavailable} onSelect={onRefresh}
        ><RefreshIcon aria-hidden="true" />{refreshLabel}</DropdownMenu.Item
      >
      {#if onOpen}<DropdownMenu.Item disabled={busy} onSelect={onOpen}
          ><ExternalIcon aria-hidden="true" />Open saved snapshot</DropdownMenu.Item
        >{/if}
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>
