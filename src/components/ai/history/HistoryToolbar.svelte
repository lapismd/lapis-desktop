<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI History, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import type { HistoryState } from "../../../lib/ai/history/state.svelte.ts";
  let { history }: { history: HistoryState } = $props();
  let filtersExpanded = $state(false);
</script>

<div class="ai-history__chrome" data-ui-part="chrome">
  <SearchFilterBar
    value={history.query}
    inputMode="plain"
    ariaLabel="Search conversations"
    placeholder="Search conversations…"
    showFilterToggle
    bind:filtersExpanded
    expandFiltersLabel="Show conversation options"
    collapseFiltersLabel="Hide conversation options"
    onValueChange={history.updateQuery}
    onClearSearch={() => history.updateQuery("")}
  >
    {#snippet filters()}
      <label class="ai-history__archive-filter">
        <Switch
          size="sm"
          aria-label="Show archived conversations"
          bind:checked={history.showArchived}
        />
        <span>Show archived</span>
      </label>
    {/snippet}
    {#snippet actions()}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props }: { props: Record<string, unknown> })}
            <Button
              {...props}
              size="icon-sm"
              variant="ghost"
              aria-label={history.expandFoldersLabel}
              disabled={history.folderPaths.length === 0}
              onclick={history.toggleAllFolders}
            >
              <ChevronsUpDownIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom"
          >{history.expandFoldersLabel}</Tooltip.Content
        >
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props }: { props: Record<string, unknown> })}
            <Button
              {...props}
              size="icon-sm"
              variant="ghost"
              aria-label={history.newChatLabel}
              onclick={() => void history.newConversation()}
            >
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">{history.newChatLabel}</Tooltip.Content>
      </Tooltip.Root>
    {/snippet}
  </SearchFilterBar>
  <p
    class="ai-history__creation-scope"
    data-testid="ai-history-creation-scope"
    aria-hidden="true"
  >
    {history.creationScopeLabel}
  </p>
</div>
