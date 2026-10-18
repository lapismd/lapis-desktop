<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import BotIcon from "@lucide/svelte/icons/bot";
  import CpuIcon from "@lucide/svelte/icons/cpu";
  import LightbulbIcon from "@lucide/svelte/icons/lightbulb";
  let { agentLabel = $bindable("Codex") }: { agentLabel?: string } = $props();
  let thinking = $state("Standard thinking"),
    model = $state("Balanced model");
</script>

{#each [{ id: "agent", label: agentLabel, icon: BotIcon, options: ["Assistant", "Reviewer"] }, { id: "thinking", label: thinking, icon: LightbulbIcon, options: ["Standard thinking", "Detailed thinking"] }, { id: "model", label: model, icon: CpuIcon, options: ["Balanced model", "Fast model"] }] as menu (menu.id)}
  <DropdownMenu.Root
    ><DropdownMenu.Trigger
      >{#snippet child({ props })}<Button
          {...props}
          variant="ghost"
          size="sm"
          aria-label={`Choose ${menu.id}: ${menu.label}`}
          class="transcript-fixture-choice"
          ><menu.icon /><span>{menu.label}</span></Button
        >{/snippet}</DropdownMenu.Trigger
    ><DropdownMenu.Content
      ><DropdownMenu.Group
        >{#each menu.options as option}<DropdownMenu.Item
            onSelect={() => {
              if (menu.id === "agent") agentLabel = option;
              else if (menu.id === "thinking") thinking = option;
              else model = option;
            }}>{option}</DropdownMenu.Item
          >{/each}</DropdownMenu.Group
      ></DropdownMenu.Content
    ></DropdownMenu.Root
  >
{/each}
