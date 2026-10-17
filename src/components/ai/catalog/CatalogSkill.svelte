<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { useTextHighlight } from "@lapis-notes/api";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import PackageIcon from "@lucide/svelte/icons/package";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import SquareArrowOutUpRightIcon from "@lucide/svelte/icons/square-arrow-out-up-right";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { toggleLeafRow, handleLeafKeydown } from "./interactions.ts";
  import {
    catalogSkillKey,
    type CatalogKindKey,
  } from "../../../lib/ai/catalog/tree.ts";
  import type { CatalogSkillRow } from "../../../lib/ai/catalog/types.ts";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let { skill, catalog }: { skill: CatalogSkillRow; catalog: CatalogState } =
    $props();
  const key = $derived(catalogSkillKey(skill.source, skill.name));
  const open = $derived(catalog.isOpen(key));
  const selected = $derived(
    Boolean(skill.path && catalog.openedCatalogPath === skill.path),
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
      aria-label={`${skill.name}${skill.shadowed ? " shadowed" : ""}`}
      data-active={selected}
      title={skill.path ? undefined : "Bundled skill is not a vault file"}
      onclick={(event) => toggleLeafRow(catalog, event, key, open)}
      onkeydown={(event) => handleLeafKeydown(catalog, event, key, open)}
    >
      <ChevronRightIcon
        class="ai-catalog__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      {#if skill.path}
        <FileTextIcon class="ai-catalog__icon" aria-hidden="true" />
      {:else}
        <PackageIcon class="ai-catalog__icon" aria-hidden="true" />
      {/if}
      <span
        class="ai-catalog__label"
        use:useTextHighlight={{ query: catalog.query, value: skill.name }}
        >{skill.name}</span
      >
      {#if skill.shadowed}
        <span class="ai-catalog__meta">shadowed</span>
      {/if}
      {#if skill.path}
        <span data-catalog-ignore-toggle>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <Button
                  {...props}
                  size="icon-sm"
                  variant="ghost"
                  class="ai-catalog__open-skill"
                  aria-label={`Open ${skill.name}`}
                  onclick={() => void catalog.openCatalogFile(skill.path!)}
                >
                  <SquareArrowOutUpRightIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="bottom">Open {skill.name}</Tooltip.Content>
          </Tooltip.Root>
        </span>
      {/if}
    </div>
    <Collapsible.Content>
      <p
        class="ai-catalog__description"
        use:useTextHighlight={{
          query: catalog.query,
          value: skill.description,
        }}
      >
        {skill.description}
      </p>
    </Collapsible.Content>
  </Collapsible.Root>
</Sidebar.MenuSubItem>
