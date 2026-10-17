<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import CatalogCommand from "./CatalogCommand.svelte";
  import CatalogSkill from "./CatalogSkill.svelte";
  import CatalogTool from "./CatalogTool.svelte";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { ownerIcon, kindIcon, kindLabel } from "./icons.ts";
  import {
    catalogKindKey,
    type CatalogKindKey,
  } from "../../../lib/ai/catalog/tree.ts";
  import type { CatalogGroup } from "../../../lib/ai/catalog/types.ts";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let {
    group,
    catalog,
    kind,
  }: { group: CatalogGroup; catalog: CatalogState; kind: CatalogKindKey } =
    $props();
  const key = $derived(catalogKindKey(group.id, kind));
  const open = $derived(catalog.isOpen(key));
  const KindIcon = $derived(kindIcon(kind));
  const label = $derived(kindLabel(kind));
</script>

<Sidebar.MenuSubItem role="none" class="ai-catalog__item">
  <Collapsible.Root
    {open}
    onOpenChange={(value) => catalog.setOpen(key, value)}
  >
    <Collapsible.Trigger
      class="ai-catalog__row"
      role="treeitem"
      aria-level={2}
      aria-expanded={open}
      aria-selected="false"
      aria-label={label}
    >
      <ChevronRightIcon
        class="ai-catalog__disclosure"
        data-open={open}
        aria-hidden="true"
      />
      <KindIcon class="ai-catalog__icon" aria-hidden="true" />
      <span class="ai-catalog__label">{label}</span>
    </Collapsible.Trigger>
    <Collapsible.Content>
      <Sidebar.MenuSub role="group" class="ai-catalog__subtree">
        {#if kind === "tools"}
          {#each group.tools as tool (`tool:${tool.name}`)}
            <CatalogTool {tool} {catalog} />
          {/each}
        {:else if kind === "commands"}
          {#each group.commands as command (`command:${command.name}`)}
            <CatalogCommand {command} {catalog} />
          {/each}
        {:else if kind === "skills"}
          {#each group.skills as skill (`skill:${skill.source}:${skill.name}`)}
            <CatalogSkill {skill} {catalog} />
          {/each}
        {:else}
          {#each group.diagnostics as diagnostic (`diag:${diagnostic.path}`)}
            <div
              class="ai-catalog__row"
              role="treeitem"
              aria-level={3}
              aria-selected="false"
            >
              <CircleAlertIcon class="ai-catalog__icon" aria-hidden="true" />
              <span class="ai-catalog__label">{diagnostic.message}</span>
            </div>
          {/each}
        {/if}
      </Sidebar.MenuSub>
    </Collapsible.Content>
  </Collapsible.Root>
</Sidebar.MenuSubItem>
