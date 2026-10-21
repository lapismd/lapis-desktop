<script lang="ts">
  import { untrack } from "svelte";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import { ResponsiveTabs } from "@lapismd/design-core/shadcn/responsive-tabs";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import BrainIcon from "@lucide/svelte/icons/brain";
  import WrenchIcon from "@lucide/svelte/icons/wrench";
  import {
    WorkspaceSettingField,
    type WorkspaceSettingsPageProps,
  } from "@lapismd/design-core/workspace/settings";
  import "./settings-tabs.css";
  let { controller, section }: WorkspaceSettingsPageProps = $props();
  let tab = $state("conversation");
  const items = [
    {
      value: "conversation",
      label: "Conversation",
      Icon: MessageCircleIcon,
      description:
        "Choose how conversations look and how agents are tagged in follow-up messages.",
    },
    {
      value: "models",
      label: "Models",
      Icon: SparklesIcon,
      description:
        "Set the default agent, model and reasoning preferences for new conversations.",
    },
    {
      value: "memory",
      label: "Memory",
      Icon: BrainIcon,
      description:
        "Control automatic memory recall and the summaries used when handing off a conversation.",
    },
    {
      value: "tools",
      label: "Tools",
      Icon: WrenchIcon,
      description:
        "Choose which application tools are available to new agent bindings. Existing bindings keep their frozen tool list.",
    },
  ];
  function groupTab(id: string) {
    if (id === "ai.runtime") return "models";
    if (id === "ai.memory" || id === "ai.handoff") return "memory";
    if (id === "ai.tools") return "tools";
    return "conversation";
  }
  type SettingField = NonNullable<
    WorkspaceSettingsPageProps["section"]["fields"]
  >[number];
  function contains(field: SettingField, id: string): boolean {
    return (
      field.id === id ||
      (field.type === "group" &&
        field.fields.some((child) => contains(child, id)))
    );
  }
  // Use the public reveal hook so search can open a field in a hidden panel.
  $effect(() => {
    const current = section;
    const previous = untrack(() => current.revealSearchEntry);
    const reveal = (id: string) => {
      const group = current.fields?.find((field) => contains(field, id));
      if (group) tab = groupTab(group.id);
      return previous?.(id);
    };
    current.revealSearchEntry = reveal;
    return () => {
      if (current.revealSearchEntry === reveal)
        current.revealSearchEntry = previous;
    };
  });
</script>

<div class="ai-settings-page">
  <Tabs.Root bind:value={tab}>
    <div class="settings-tab-strip">
      <ResponsiveTabs
        bind:value={tab}
        {items}
        inheritContext
        presentation="pill"
        label="AI settings"
      />
    </div>
    {#each items as item (item.value)}
      <Tabs.Content value={item.value} aria-label={item.label}>
        <p class="settings-tab-description">{item.description}</p>
        {#each section.fields?.filter((field) => groupTab(field.id) === item.value) ?? [] as group (group.id)}
          {#if group.type === "group"}
            <section
              data-settings-schema-section-id={group.id}
              aria-label={group.title}
            >
              {#if group.id === "ai.handoff"}<h2>{group.title}</h2>{/if}
              <div class="ai-settings-fields">
                {#each group.fields as field (field.id)}
                  {#if field.type === "group"}
                    <div class="ai-settings-subgroup">
                      <WorkspaceSettingField {controller} {field} />
                    </div>
                  {:else}
                    <WorkspaceSettingField {controller} {field} />
                  {/if}
                {/each}
              </div>
            </section>
          {/if}
        {/each}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
</div>

<style>
  .ai-settings-page {
    min-width: 0;
  }
  .ai-settings-fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(10rem, min(40%, 20rem));
    padding: 0 1.25rem;
    border-radius: 0.5rem;
    background: var(--ui-workspace-panel);
  }
  .ai-settings-subgroup {
    grid-column: 1 / -1;
  }
  h2 {
    margin: 1.75rem 0 0.85rem;
    font-size: var(--ui-workspace-settings-heading-size, 1rem);
    font-weight: var(--ui-workspace-settings-heading-weight, 600);
  }
  @container workspace-settings (max-width: 44rem) {
    .ai-settings-fields {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
