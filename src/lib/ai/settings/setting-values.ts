// SPDX-License-Identifier: Apache-2.0
// Adapted from Lapis AI setting change handling; see ../NOTICE.md.
import type { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { AI_FIELD_IDS, type AiSettingKey } from "./setting-fields.ts";
import { ACP_AGENT_IDS, PROCESSOR_AGENT_IDS } from "./acp-agents.ts";
import {
  APP_TOOL_SETTING_PREFIX,
  applyAppToolEnablement,
  isAppToolEnabled,
  type AiPluginSettings,
} from "./ai-settings.ts";
import { registeredAppToolRefs } from "./app-tool-setting-rows.ts";

const keys = Object.keys(AI_FIELD_IDS) as AiSettingKey[];
const booleans = new Set([
  "automaticallyMentionAgents",
  "memoryAutomaticRecall",
  "memoryConsolidationEnabled",
  "handoffSummariesEnabled",
  "appToolsEnabled",
]);
const strings = new Set([
  "defaultModel",
  "memoryConsolidationModel",
  "handoffSummaryModel",
]);
const choices: Partial<Record<AiSettingKey, readonly string[]>> = {
  approvalPolicy: ["ask", "allow-all"],
  transcriptView: ["document", "classic"],
  defaultRuntime: ["auto", "acp"],
  acpAgent: ACP_AGENT_IDS,
  thinking: ["default", "off", "low", "medium", "high"],
  memoryConsolidationRuntime: ["acp"],
  memoryConsolidationAgent: PROCESSOR_AGENT_IDS,
  handoffSummaryRuntime: ["acp"],
  handoffSummaryAgent: PROCESSOR_AGENT_IDS,
};

export function readAiSetting(
  settings: AiPluginSettings,
  id: string,
  registry: AppToolRegistry,
): unknown {
  const key = keys.find((key) => AI_FIELD_IDS[key] === id);
  if (key) {
    return settings[key];
  }
  if (!id.startsWith(APP_TOOL_SETTING_PREFIX)) return undefined;
  const registered = registry.get(id.slice(APP_TOOL_SETTING_PREFIX.length));
  return registered
    ? isAppToolEnabled(
        { name: registered.tool.name, owner: registered.owner },
        settings,
      )
    : undefined;
}

export function aiSettingPatch(
  settings: AiPluginSettings,
  id: string,
  value: unknown,
  registry: AppToolRegistry,
): Partial<AiPluginSettings> {
  const key = keys.find((key) => AI_FIELD_IDS[key] === id);
  if (key) {
    const valid = booleans.has(key)
      ? typeof value === "boolean"
      : strings.has(key)
        ? typeof value === "string"
        : typeof value === "string" && choices[key]?.includes(value);
    if (!valid) throw new Error(`Invalid AI setting: ${id}`);
    return {
      [key]: value,
      ...(key === "acpAgent" && value !== settings.acpAgent
        ? { thinking: "default" as const }
        : {}),
    };
  }
  if (!id.startsWith(APP_TOOL_SETTING_PREFIX) || typeof value !== "boolean")
    throw new Error(`Unknown AI setting: ${id}`);
  const registered = registry.get(id.slice(APP_TOOL_SETTING_PREFIX.length));
  if (!registered) throw new Error("Application tool is no longer registered");
  return applyAppToolEnablement(
    settings,
    { name: registered.tool.name, owner: registered.owner },
    value,
    registeredAppToolRefs(registry),
  );
}
