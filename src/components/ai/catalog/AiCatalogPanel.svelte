<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { createCatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  import type { AiCatalogProps } from "../../../lib/ai/catalog/props.ts";
  import CatalogOwner from "./CatalogOwner.svelte";
  import CatalogToolbar from "./CatalogToolbar.svelte";
  import "./panel.css";
  let props: AiCatalogProps = $props();
  const catalog = untrack(() => createCatalogState(props));
  onMount(catalog.mount);
</script>

<Tooltip.Provider delayDuration={0}>
  <div
    class="ai-catalog"
    data-ui-component="ai-catalog"
    data-testid="ai-catalog"
  >
    <CatalogToolbar {catalog} />
    <ScrollArea class="ai-catalog__scroll">
      <div class="ai-catalog__body">
        {#if catalog.error}<p class="ai-catalog__state" role="alert">
            {catalog.error}
          </p>{/if}
        {#if catalog.visibleGroups.length === 0 && catalog.loading}<p
            class="ai-catalog__state"
          >
            Loading catalog…
          </p>
        {:else if catalog.visibleGroups.length === 0 && !catalog.error}
          <p class="ai-catalog__state">
            {catalog.filtering
              ? "No catalog items match your filter."
              : "No catalog items yet."}
          </p>
        {:else if catalog.visibleGroups.length > 0}
          <Sidebar.Menu
            class="ai-catalog__tree"
            role="tree"
            aria-label="AI catalog"
          >
            {#each catalog.visibleGroups as group (group.id)}
              <CatalogOwner {group} {catalog} />
            {/each}
          </Sidebar.Menu>
        {/if}
      </div>
    </ScrollArea>
  </div>
</Tooltip.Provider>
