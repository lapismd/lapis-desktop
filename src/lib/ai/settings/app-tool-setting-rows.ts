// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI setting rows; see ../NOTICE.md.
import type { App } from "@lapis-notes/api";
import type { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import {
  appToolSettingId,
  isAppToolEnabled,
  type AiPluginSettings,
} from "./ai-settings.ts";

export function registeredAppToolRefs(registry: AppToolRegistry) {
  return registry.list().map(({ tool, owner }) => ({ name: tool.name, owner }));
}

export function listAppToolSettingRows(app: App, settings: AiPluginSettings) {
  return app.agentTools
    .list()
    .slice()
    .sort((left, right) => left.tool.name.localeCompare(right.tool.name))
    .map(({ tool, owner }) => {
      const pluginLabel =
        app.plugins.plugins.get(owner.pluginId)?.manifest.name?.trim() ||
        owner.pluginId;
      return {
        name: tool.name,
        fieldId: appToolSettingId(tool.name),
        description: `${pluginLabel} · ${tool.effect}`,
        owner,
        enabled: isAppToolEnabled({ name: tool.name, owner }, settings),
      };
    });
}
