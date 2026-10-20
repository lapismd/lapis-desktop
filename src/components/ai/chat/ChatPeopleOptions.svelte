<script lang="ts">
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import type { ComposerPersonOption } from "../../../lib/ai/conversations/recipients.ts";
  let {
    people,
    disabled = false,
    onSelect,
  }: {
    people: readonly ComposerPersonOption[];
    disabled?: boolean;
    onSelect(person: ComposerPersonOption): void;
  } = $props();
</script>

{#if people.length}<CommandView.Group heading="People">
    {#each people as person (person.id)}
      <CommandView.Item
        value={`person:${person.id}`}
        {disabled}
        onSelect={() => onSelect(person)}
      >
        <CommandView.ItemIcon
          ><Avatar
            src={person.avatar}
            background={person.avatarBackground}
            name={person.label}
            size="xs"
            decorative
          /></CommandView.ItemIcon
        >
        <CommandView.ItemLabel>{person.label}</CommandView.ItemLabel>
        <CommandView.ItemDescription
          >Person · Mention in this message</CommandView.ItemDescription
        >
      </CommandView.Item>
    {/each}
  </CommandView.Group>{/if}
