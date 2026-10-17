<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI Catalog, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ChevronsDownUpIcon from "@lucide/svelte/icons/chevrons-down-up";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  let { catalog }: { catalog: CatalogState } = $props();
</script>

<div class="ai-catalog__chrome" data-ui-part="chrome">
  <div data-ui-part="toolbar">
    <SearchFilterBar
      value={catalog.query}
      inputMode="plain"
      ariaLabel="Filter catalog"
      placeholder="Filter catalog…"
      onValueChange={(value) => {
        catalog.query = value;
      }}
      onClearSearch={() => {
        catalog.query = "";
      }}
    >
      {#snippet actions()}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props }: { props: Record<string, unknown> })}
              <Button
                {...props}
                size="icon-sm"
                variant="ghost"
                aria-label={catalog.allExpanded ? "Collapse all" : "Expand all"}
                disabled={catalog.expandableKeys.length === 0}
                onclick={catalog.toggleAll}
              >
                {#if catalog.allExpanded}
                  <ChevronsDownUpIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                {:else}
                  <ChevronsUpDownIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />
                {/if}
              </Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            {catalog.allExpanded ? "Collapse all" : "Expand all"}
          </Tooltip.Content>
        </Tooltip.Root>
      {/snippet}
    </SearchFilterBar>
  </div>
</div>
