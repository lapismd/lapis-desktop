<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { useTextHighlight } from "@lapis-notes/api";
  import CatalogKind from "./CatalogKind.svelte";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { ownerIcon, kindIcon, kindLabel } from "./icons.ts";
  import {
    catalogOwnerKey,
    type CatalogKindKey,
  } from "../../../lib/ai/catalog/tree.ts";
  import type { CatalogGroup } from "../../../lib/ai/catalog/types.ts";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let { group, catalog }: { group: CatalogGroup; catalog: CatalogState } =
    $props();
  const key = $derived(catalogOwnerKey(group.id));
  const open = $derived(catalog.isOpen(key));
  const OwnerIcon = $derived(ownerIcon(group));
</script>

<Sidebar.MenuItem role="none" class="ai-catalog__item">
  <Collapsible.Root
    {open}
    onOpenChange={(value) => catalog.setOpen(key, value)}
  >
    <Collapsible.Trigger
      class="ai-catalog__row"
      role="treeitem"
      aria-level={1}
      aria-expanded={open}
      aria-selected="false"
      aria-label={group.label}
    >
      <ChevronRightIcon
        class="ai-catalog__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      {#if group.kind === "folders" && open}
        <FolderOpenIcon class="ai-catalog__icon" aria-hidden="true" />
      {:else}
        <OwnerIcon class="ai-catalog__icon" aria-hidden="true" />
      {/if}
      <span
        class="ai-catalog__label"
        use:useTextHighlight={{ query: catalog.query, value: group.label }}
        >{group.label}</span
      >
    </Collapsible.Trigger>
    <Collapsible.Content>
      <Sidebar.MenuSub role="group" class="ai-catalog__subtree">
        {#if group.tools.length > 0}
          <CatalogKind {group} kind="tools" {catalog} />
        {/if}
        {#if group.commands.length > 0}
          <CatalogKind {group} kind="commands" {catalog} />
        {/if}
        {#if group.skills.length > 0}
          <CatalogKind {group} kind="skills" {catalog} />
        {/if}
        {#if group.diagnostics.length > 0}
          <CatalogKind {group} kind="diagnostics" {catalog} />
        {/if}
      </Sidebar.MenuSub>
    </Collapsible.Content>
  </Collapsible.Root>
</Sidebar.MenuItem>
