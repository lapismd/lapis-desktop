<script lang="ts">
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import PanelsTopLeftIcon from "@lucide/svelte/icons/panels-top-left";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import LibraryIcon from "@lucide/svelte/icons/library";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";

  let {
    panelProps,
    actions,
  }: Pick<TranscriptPanelProps, "panelProps" | "actions"> = $props();
  const app = $derived(panelProps.app);
  const views = [
    {
      command: "ai:open-history",
      label: "AI conversations",
      icon: HistoryIcon,
    },
    { command: "ai:open-catalog", label: "Catalog", icon: LibraryIcon },
    {
      command: "ai:open-import-sessions",
      label: "Import AI sessions",
      icon: DownloadIcon,
    },
  ];
</script>

<DropdownMenu.Sub>
  <DropdownMenu.SubTrigger disabled={!app} data-testid="ai-chat-view-menu">
    <PanelsTopLeftIcon data-icon="inline-start" aria-hidden="true" />View
  </DropdownMenu.SubTrigger>
  <DropdownMenu.SubContent>
    <DropdownMenu.Group>
      {#each views as view (view.command)}
        <DropdownMenu.Item
          data-ai-view-command={view.command}
          disabled={!app?.commands.isCommandAvailable(view.command)}
          onclick={() =>
            void actions.perform(() =>
              app?.commands.executeCommand(view.command),
            )}
        >
          <view.icon data-icon="inline-start" aria-hidden="true" />{view.label}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Group>
  </DropdownMenu.SubContent>
</DropdownMenu.Sub>
