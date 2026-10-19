<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import DocumentIcon from "@lucide/svelte/icons/message-square-text";
  import ClassicIcon from "@lucide/svelte/icons/messages-square";
  let {
    view = $bindable<"document" | "classic">("document"),
    onChange,
  }: {
    view?: "document" | "classic";
    onChange?: (view: "document" | "classic") => void;
  } = $props();
  const label = $derived(
    view === "document" ? "Switch to Classic view" : "Switch to Document view",
  );
</script>

<Tooltip.Provider
  ><Tooltip.Root
    ><Tooltip.Trigger>
      {#snippet child({ props })}<Button
          {...props}
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onclick={() => {
            view = view === "document" ? "classic" : "document";
            onChange?.(view);
          }}
        >
          {#if view === "document"}<DocumentIcon
              aria-hidden="true"
            />{:else}<ClassicIcon aria-hidden="true" />{/if}
        </Button>{/snippet}
    </Tooltip.Trigger><Tooltip.Content>{label}</Tooltip.Content></Tooltip.Root
  ></Tooltip.Provider
>
