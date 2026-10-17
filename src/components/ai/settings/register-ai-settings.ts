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
  const register = () =>
    controller.settings.registerDefinition({
      section: createAiSettingsSection(app, settings.get()),
      source,
    });
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
