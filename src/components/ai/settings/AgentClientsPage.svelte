<script lang="ts">
  import { untrack } from "svelte";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import { ResponsiveTabs } from "@lapismd/design-core/shadcn/responsive-tabs";
  import BotIcon from "@lucide/svelte/icons/bot";
  import TerminalIcon from "@lucide/svelte/icons/terminal";
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import AgentClientsField from "./AgentClientsField.svelte";
  import AgentProfilesField from "./AgentProfilesField.svelte";
  import "./settings-tabs.css";
  let { section }: WorkspaceSettingsPageProps = $props();
  let tab = $state("agents");
  const items = [
    { value: "agents", label: "Agents", Icon: BotIcon },
    { value: "clients", label: "Clients", Icon: TerminalIcon },
  ];
  const clients = $derived(
    section.fields?.find((field) => field.id === "ai.clients"),
  );
  const profiles = $derived(
    section.fields?.find((field) => field.id === "ai.participants"),
  );
  $effect(() => {
    const current = section;
    const previous = untrack(() => current.revealSearchEntry);
    const reveal = (id: string) => {
      tab = id === "ai.clients" ? "clients" : "agents";
      return previous?.(id);
    };
    current.revealSearchEntry = reveal;
    return () => {
      if (current.revealSearchEntry === reveal)
        current.revealSearchEntry = previous;
    };
  });
</script>

<div class="agents-settings-page">
  <Tabs.Root bind:value={tab}>
    <div class="settings-tab-strip">
      <ResponsiveTabs
        bind:value={tab}
        {items}
        inheritContext
        presentation="pill"
        label="Agent settings"
      />
    </div>
    <Tabs.Content value="agents" aria-label="Agents">
      <p class="settings-tab-description">
        Manage named agents for chats in this vault, including their models,
        avatars and defaults. Choose them with @ or the Agents picker.
      </p>
      {#if profiles?.type === "custom"}
        <div data-setting-id={profiles.id}>
          <AgentProfilesField field={profiles} />
        </div>
      {/if}
    </Tabs.Content>
    <Tabs.Content value="clients" aria-label="Clients">
      <p class="settings-tab-description">
        Manage installed ACP clients and check their runtime versions and
        updates.
      </p>
      {#if clients?.type === "custom"}
        <div data-setting-id={clients.id}>
          <AgentClientsField field={clients} />
        </div>
      {/if}
    </Tabs.Content>
  </Tabs.Root>
</div>

<style>
  .agents-settings-page {
    min-width: 0;
  }
</style>
