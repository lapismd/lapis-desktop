import AiComputeField from "./AiComputeField.svelte";
import AgentClientsField from "./AgentClientsField.svelte";
import AgentClientsPage from "./AgentClientsPage.svelte";
import AgentProfilesField from "./AgentProfilesField.svelte";
import AiSettingsPage from "./AiSettingsPage.svelte";
import AiProvidersField from "./AiProvidersField.svelte";
import type { AgentProfileManagement } from "../../../lib/ai/settings/agent-profile-editor.ts";
// SPDX-License-Identifier: Apache-2.0
// Adapted from Lapis register-ai-settings; see ../../../lib/ai/NOTICE.md.
import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { ACP_AGENT_IDS } from "../../../lib/ai/settings/acp-agents.ts";
import {
  AiModelOptions,
  type AiModelCatalog,
} from "../../../lib/ai/settings/model-options.ts";
import {
  aiModelSourceId,
  createAiSettingsSection,
} from "../../../lib/ai/settings/setting-fields.ts";
import {
  aiSettingPatch,
  readAiSetting,
} from "../../../lib/ai/settings/setting-values.ts";
import type { AiSettingsStore } from "../../../lib/ai/settings/settings-store.ts";

type SettingsOwner = Pick<Plugin, "app" | "register"> & {
  clients?: import("../../../lib/ai/settings/clients.svelte.ts").AgentClients;
  compute?: import("../../../lib/ai/settings/compute.svelte.ts").AiCompute;
  providers?: import("../../../lib/ai/settings/providers.svelte.ts").AiProviders;
  settings: AiSettingsStore;
  models: AiModelCatalog;
  report(error: unknown): void;
};

export function registerAiSettings(plugin: SettingsOwner): void {
  const { app, settings } = plugin;
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  let disposed = false;
  const models = new AiModelOptions(settings, plugin.models, (error) => {
    if (!disposed) plugin.report(error);
  });
  const cleanups: (() => void)[] = [];
  let section: (() => void) | undefined;
  // Register the ownership boundary before allocating any disposable resources.
  plugin.register(() => {
    disposed = true;
    models.close();
    section?.();
    for (const cleanup of cleanups.reverse()) cleanup();
  });
  const source = {
    get: (id: string) => readAiSetting(settings.get(), id, app.agentTools),
    set: async (id: string, value: unknown) => {
      if (disposed) throw new Error("AI settings are unavailable");
      await settings.update((current) => {
        if (disposed) throw new Error("AI settings are unavailable");
        return aiSettingPatch(current, id, value, app.agentTools);
      });
    },
    subscribe: (listener: () => void) => settings.subscribe(() => listener()),
  };
  const profiles: AgentProfileManagement = {
    app,
    settings,
    update: (patch) =>
      settings.update(() => {
        if (disposed) throw new Error("AI settings are unavailable");
        return patch;
      }),
    remove: (id) =>
      settings.update((current) => {
        if (disposed) throw new Error("AI settings are unavailable");
        return {
          agentParticipants: (current.agentParticipants ?? []).filter(
            (entry) => entry.id !== id,
          ),
        };
      }),
    loadExecutionModes: async (agent, runtime) => {
      if (disposed) throw new Error("AI settings are unavailable");
      const modes =
        (await plugin.models.listExecutionModes?.(agent, runtime)) ?? [];
      if (disposed) throw new Error("AI settings are unavailable");
      return modes;
    },
    loadModels: async (agent, runtime) => {
      if (disposed) throw new Error("AI settings are unavailable");
      const result = await plugin.models.listModels(agent, runtime);
      if (disposed) throw new Error("AI settings are unavailable");
      return result;
    },
  };
  cleanups.push(
    controller.settings.registerDefinition({
      section: {
        id: "ai-agents",
        title: "Agents",
        description:
          "Manage named agents for this vault and the clients installed on this device.",
        icon: "bot",
        order: 36,
        navigationGroupId: "core-plugins",
        sourcePluginId: "ai",
        page: AgentClientsPage,
        fields: [
          {
            id: "ai.participants",
            type: "custom",
            title: "Your agents",
            component: AgentProfilesField,
            management: profiles,
          } as import("@lapis-notes/api").WorkspaceCustomSetting,
          {
            id: "ai.clients",
            type: "custom",
            title: "Installed clients",
            component: AgentClientsField,
            management: plugin.clients,
          } as import("@lapis-notes/api").WorkspaceCustomSetting,
        ],
      },
      source,
    }),
  );
  const register = () => {
    const definition = createAiSettingsSection(app, settings.get());
    definition.page = AiSettingsPage;
    if (plugin.providers)
      definition.fields?.push({
        id: "ai.providers",
        type: "custom",
        title: "Lapis provider",
        component: AiProvidersField,
        management: plugin.providers,
      } as import("@lapis-notes/api").WorkspaceCustomSetting);
    if (plugin.compute)
      definition.fields?.push({
        id: "ai.compute",
        type: "custom",
        title: "Optional compute",
        component: AiComputeField,
        management: plugin.compute,
      } as import("@lapis-notes/api").WorkspaceCustomSetting);
    return controller.settings.registerDefinition({
      section: definition,
      source,
    });
  };
  section = register();
  const refresh = () => {
    if (disposed) return;
    const selected = controller.settings.selectedSectionId;
    section?.();
    section = register();
    if (selected === "ai") controller.settings.selectSection("ai");
  };
  const unsubscribe = settings.subscribe((patch) => {
    if (
      [
        "acpAgent",
        "defaultRuntime",
        "memoryConsolidationRuntime",
        "handoffSummaryRuntime",
      ].some((key) => key in patch)
    )
      refresh();
  });
  cleanups.push(unsubscribe);
  for (const provider of ACP_AGENT_IDS) {
    cleanups.push(
      controller.configuration.optionSources.register({
        id: aiModelSourceId(provider),
        load: () => models.load(provider),
      }),
    );
  }
  const migrate = () => {
    void settings.update({}).catch((error) => {
      if (!disposed) plugin.report(error);
    });
  };
  const toolRef = app.agentTools.on("changed", () => {
    migrate();
    refresh();
  });
  cleanups.push(() => app.agentTools.offref(toolRef));
  migrate();
}
