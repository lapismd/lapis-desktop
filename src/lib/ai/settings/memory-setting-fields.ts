// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI memory and handoff settings; see ../NOTICE.md.
import type { WorkspaceSettingsSection } from "@lapis-notes/api";
import { DEFAULT_AI_SETTINGS, type AiPluginSettings } from "./ai-settings.ts";

export function runtimeDescription(description: string, saved: string): string {
  if (saved === "acp" || saved === "auto") return description;
  const label =
    saved === "codex-native"
      ? "Codex native"
      : saved === "opencode-native"
        ? "OpenCode native"
        : saved;
  return `${description} Saved preference: ${label} (unavailable). The saved value is retained until you choose a replacement.`;
}

export function memorySettingFields(
  current: AiPluginSettings,
): NonNullable<WorkspaceSettingsSection["fields"]> {
  return [
    {
      id: "ai.memoryFolder",
      type: "string",
      title: "Memory folder",
      description:
        "Visible vault folder for daily notes and curated memory. Changing it moves the folder; existing destinations are never overwritten.",
      default: "Memory",
    },
    {
      id: "ai.memoryTimezone",
      type: "string",
      title: "Memory timezone",
      description:
        "IANA timezone for future dated notes, for example Europe/London.",
      default: current.memoryTimezone,
    },
    {
      id: "ai.memoryAutomaticCapture",
      type: "boolean",
      title: "Automatic memory capture",
      description:
        "Save qualifying observations after completed turns to dated Markdown notes in this vault.",
      default: true,
    },
    {
      id: "ai.memoryAutomaticRecall",
      type: "boolean",
      title: "Automatic memory recall",
      description:
        "Recall up to three relevant note excerpts within the current scope. Recalled context links to the original Markdown notes.",
      default: DEFAULT_AI_SETTINGS.memoryAutomaticRecall,
    },
    {
      id: "ai.memoryConsolidationEnabled",
      type: "boolean",
      title: "Automatic memory consolidation",
      description:
        "Use the separately pinned processor below for bounded background proposals. This may consume provider quota.",
      default: DEFAULT_AI_SETTINGS.memoryConsolidationEnabled,
    },
    {
      id: "ai.memoryConsolidationRuntime",
      type: "enum",
      title: "Memory processor runtime",
      description: runtimeDescription(
        "Pinned independently from the interactive chat runtime.",
        current.memoryConsolidationRuntime,
      ),
      default: "acp",
      allowUnknownOptions: true,
      options: [{ value: "acp", label: "ACP" }],
    },
    {
      id: "ai.memoryConsolidationAgent",
      type: "enum",
      title: "Memory processor agent",
      description:
        "Only the built-in Lapis AI profile supports unattended processing with tools and filesystem discovery disabled. Codex, Cursor, OpenCode and named Lapis agents are available for chat. Saved external-client preferences remain inactive.",
      allowUnknownOptions: true,
      default: DEFAULT_AI_SETTINGS.memoryConsolidationAgent,
      options: [{ value: "local", label: "Lapis AI" }],
    },
    {
      id: "ai.memoryConsolidationModel",
      type: "string",
      title: "Memory processor model",
      description:
        "Exact model used only for restricted background consolidation.",
      default: DEFAULT_AI_SETTINGS.memoryConsolidationModel,
      optionsSource: "ai.processorModels.memory",
      allowUnknownOptions: false,
    },
    {
      id: "ai.handoffSummariesEnabled",
      type: "boolean",
      title: "Background handoff summaries",
      description:
        "Prepare verified summaries after long turns for future cross-agent switches. This never runs during a switch and may consume provider quota.",
      default: DEFAULT_AI_SETTINGS.handoffSummariesEnabled,
    },
    {
      id: "ai.handoffSummaryRuntime",
      type: "enum",
      title: "Handoff summary runtime",
      description: runtimeDescription(
        "Pinned independently from the interactive chat runtime.",
        current.handoffSummaryRuntime,
      ),
      default: "acp",
      allowUnknownOptions: true,
      options: [{ value: "acp", label: "ACP" }],
    },
    {
      id: "ai.handoffSummaryAgent",
      type: "enum",
      title: "Handoff summary agent",
      description:
        "Only the built-in Lapis AI profile supports unattended processing with tools and filesystem discovery disabled. Codex, Cursor, OpenCode and named Lapis agents are available for chat. Saved external-client preferences remain inactive.",
      allowUnknownOptions: true,
      default: DEFAULT_AI_SETTINGS.handoffSummaryAgent,
      options: [{ value: "local", label: "Lapis AI" }],
    },
    {
      id: "ai.handoffSummaryModel",
      type: "string",
      title: "Handoff summary model",
      description: "Exact model used only for restricted background summaries.",
      default: DEFAULT_AI_SETTINGS.handoffSummaryModel,
      optionsSource: "ai.processorModels.handoff",
      allowUnknownOptions: false,
    },
  ];
}
