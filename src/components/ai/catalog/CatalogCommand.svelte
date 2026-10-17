<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { useTextHighlight } from "@lapis-notes/api";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import SquareArrowOutUpRightIcon from "@lucide/svelte/icons/square-arrow-out-up-right";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { toggleLeafRow, handleLeafKeydown } from "./interactions.ts";
  import {
    catalogCommandKey,
    type CatalogKindKey,
  } from "../../../lib/ai/catalog/tree.ts";
  import type { CatalogCommandRow } from "../../../lib/ai/catalog/types.ts";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let {
    command,
    catalog,
  }: { command: CatalogCommandRow; catalog: CatalogState } = $props();
  const key = $derived(catalogCommandKey(command.name));
  const open = $derived(catalog.isOpen(key));
  const slashName = $derived("/" + command.name);
  const selected = $derived(
    Boolean(command.path && catalog.openedCatalogPath === command.path),
  );
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
      aria-selected={selected}
      aria-label={slashName}
      data-active={selected}
      onclick={(event) => toggleLeafRow(catalog, event, key, open)}
      onkeydown={(event) => handleLeafKeydown(catalog, event, key, open)}
    >
      <ChevronRightIcon
        class="ai-catalog__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      <span
        class="ai-catalog__label"
        use:useTextHighlight={{ query: catalog.query, value: slashName }}
        >{slashName}</span
      >
      {#if command.path}
        <span data-catalog-ignore-toggle>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <Button
                  {...props}
                  size="icon-sm"
                  variant="ghost"
                  class="ai-catalog__open-skill"
                  aria-label={`Open ${command.name}`}
                  onclick={() => void catalog.openCatalogFile(command.path!)}
                >
                  <SquareArrowOutUpRightIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">Open {command.name}</Tooltip.Content>
          </Tooltip.Root>
        </span>
      {/if}
    </div>
    <Collapsible.Content>
      <p
        class="ai-catalog__description"
        use:useTextHighlight={{
          query: catalog.query,
          value: command.description,
        }}
      >
        {command.description}
      </p>
    </Collapsible.Content>
  </Collapsible.Root>
</Sidebar.MenuSubItem>
