<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { Checkbox } from "@lapismd/design-core/shadcn/checkbox";
  import { useTextHighlight } from "@lapis-notes/api";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { toggleLeafRow, handleLeafKeydown } from "./interactions.ts";
  import {
    catalogToolKey,
    type CatalogKindKey,
  } from "../../../lib/ai/catalog/tree.ts";
  import type { CatalogToolRow } from "../../../lib/ai/catalog/types.ts";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let { tool, catalog }: { tool: CatalogToolRow; catalog: CatalogState } =
    $props();
  const key = $derived(catalogToolKey(tool.name));
  const open = $derived(catalog.isOpen(key));
</script>

<Sidebar.MenuSubItem role="none" class="ai-catalog__item">
  <Collapsible.Root
    {open}
    onOpenChange={(value) => catalog.setOpen(key, value)}
  >
    <div
      class="ai-catalog__row"
      role="treeitem"
      tabindex="0"
      aria-level={3}
      aria-expanded={open}
      aria-selected="false"
      aria-label={`${tool.name} ${tool.effect}`}
      onclick={(event) => toggleLeafRow(catalog, event, key, open)}
      onkeydown={(event) => handleLeafKeydown(catalog, event, key, open)}
    >
      <ChevronRightIcon
        class="ai-catalog__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      <span class="ai-catalog__enable" data-catalog-ignore-toggle>
        <Checkbox
          checked={tool.enabled}
          disabled={catalog.pendingTools.has(tool.name)}
          aria-label={`Enable ${tool.name} for the next chat`}
          onCheckedChange={(checked) =>
            void catalog.toggleTool(tool, checked === true)}
        />
      </span>
      <span
        class="ai-catalog__label"
        use:useTextHighlight={{ query: catalog.query, value: tool.name }}
        >{tool.name}</span
      >
      <span class="ai-catalog__meta">{tool.effect}</span>
    </div>
    <Collapsible.Content>
      <p
        class="ai-catalog__description"
        use:useTextHighlight={{ query: catalog.query, value: tool.description }}
      >
        {tool.description}
      </p>
    </Collapsible.Content>
  </Collapsible.Root>
</Sidebar.MenuSubItem>
