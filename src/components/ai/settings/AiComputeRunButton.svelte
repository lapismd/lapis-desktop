<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import PlayIcon from "@lucide/svelte/icons/play";
  import SquareIcon from "@lucide/svelte/icons/square";
  let {
    name,
    running,
    disabled = false,
    compact = false,
    onActivate,
  }: {
    name: string;
    running: boolean;
    disabled?: boolean;
    compact?: boolean;
    onActivate: () => Promise<unknown>;
  } = $props();
  let working = $state(false);
  const label = $derived(`${running ? "Stop" : "Start"} model ${name}`);
  async function activate() {
    if (working || disabled) return;
    working = true;
    try {
      await onActivate();
    } catch {
      /* The compute owner publishes the operation failure notification. */
    } finally {
      working = false;
    }
  }
</script>

<Tooltip.Provider delayDuration={0}
  ><Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}<Button
          {...props}
          variant={running ? "destructive" : "outline"}
          size="icon-sm"
          style={compact
            ? "width:1.125rem;height:1.125rem;min-height:0;padding:0"
            : undefined}
          aria-label={label}
          disabled={working || disabled}
          onclick={activate}
          >{#if running}<SquareIcon aria-hidden="true" />{:else}<PlayIcon
              aria-hidden="true"
            />{/if}</Button
        >{/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="top" role="tooltip">{label}</Tooltip.Content>
  </Tooltip.Root></Tooltip.Provider
>
