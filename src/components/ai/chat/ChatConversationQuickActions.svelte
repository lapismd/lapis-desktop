<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import type { TranscriptPanelProps } from "../../../lib/ai/chat/panel/transcript.ts";
  let {
    panelProps,
    controller,
    actions,
  }: Pick<TranscriptPanelProps, "panelProps" | "controller" | "actions"> =
    $props();
  const pinLabel = $derived(
    controller.conversationPinned ? "Unpin Chat" : "Pin Chat",
  );
  const archived = $derived(controller.conversationStatus === "archived");
  const archiveLabel = $derived(archived ? "Restore Chat" : "Archive Chat");
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon-sm"
          aria-label={pinLabel}
          aria-pressed={controller.conversationPinned}
          disabled={!!panelProps.initializing || !controller.location}
          onclick={() =>
            void actions.perform(() =>
              controller.setPinned(!controller.conversationPinned),
            )}
        >
          {#if controller.conversationPinned}<PinOffIcon aria-hidden="true" />
          {:else}<PinIcon aria-hidden="true" />{/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>{pinLabel}</Tooltip.Content>
  </Tooltip.Root>
  {#if panelProps.repository}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label={archiveLabel}
            disabled={!controller.location}
            onclick={() =>
              void actions.perform(() => controller.archiveCurrent(!archived))}
          >
            {#if archived}<ArchiveRestoreIcon aria-hidden="true" />
            {:else}<ArchiveIcon aria-hidden="true" />{/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{archiveLabel}</Tooltip.Content>
    </Tooltip.Root>
  {/if}
</Tooltip.Provider>
