<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI History, see ../../../lib/ai/NOTICE.md. -->
<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { createHistoryState } from "../../../lib/ai/history/state.svelte.ts";
  import type { AiHistoryProps } from "../../../lib/ai/history/props.ts";
  import HistoryToolbar from "./HistoryToolbar.svelte";
  import HistoryFolder from "./HistoryFolder.svelte";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import "./panel.css";
  let props: AiHistoryProps = $props();
  const history = untrack(() => createHistoryState(props));
  let root = $state<HTMLDivElement>();
  onMount(history.mount);
  $effect(() => {
    history.scopeDir;
    history.entries;
    void tick().then(() => {
      if (root?.isConnected)
        root
          .querySelector<HTMLElement>('[data-active-folder="true"]')
          ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  });
</script>

<Tooltip.Provider delayDuration={0}>
  <div
    bind:this={root}
    class="ai-history"
    data-ui-component="ai-conversation-history"
    data-testid="ai-conversation-history"
    data-current-scope={history.scopeDir || "vault-root"}
    data-creation-scope={history.selectedScope || "vault-root"}
  >
    <HistoryToolbar {history} />
    <ScrollArea class="ai-history__scroll">
      <div class="ai-history__body">
        {#if history.loading && history.entries.length === 0}
          <div
            class="ai-history-skeleton"
            role="status"
            aria-label="Loading conversations"
            aria-busy="true"
          >
            {#each [1, 2, 3, 4] as row (row)}<Skeleton
                style="height:2.5rem;width:100%"
              />{/each}
          </div>
        {:else if history.folders.length === 0}
          <Empty.Root
            ><Empty.Header
              ><Empty.Media variant="icon"
                ><HistoryIcon aria-hidden="true" /></Empty.Media
              ><Empty.Title>
                {history.error
                  ? "History is unavailable"
                  : history.query.trim()
                    ? "No matching conversations"
                    : "No conversations yet"}
              </Empty.Title><Empty.Description
                >{history.error
                  ? "Refresh to try loading local history again."
                  : "Start a conversation or change the current search."}</Empty.Description
              ></Empty.Header
            ></Empty.Root
          >
        {:else if history.folders.length > 0}
          <Sidebar.Menu
            class="ai-history__tree"
            role="tree"
            aria-label="Conversation history"
          >
            {#each history.folders as folder (folder.path || "vault-root")}
              <HistoryFolder {folder} {history} />
            {/each}
          </Sidebar.Menu>
        {/if}
      </div>
    </ScrollArea>
  </div>
</Tooltip.Provider>

<style>
  .ai-history-skeleton {
    display: grid;
    gap: 0.375rem;
  }
</style>
