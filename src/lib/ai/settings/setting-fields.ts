// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI declarative fields; see ../NOTICE.md.
import type { App, WorkspaceSettingsSection } from "@lapis-notes/api";
import { ACP_AGENT_IDS } from "./acp-agents.ts";
import { APPROVAL_POLICIES } from "../core/approval-policy.ts";
import { DEFAULT_AI_SETTINGS, type AiPluginSettings } from "./ai-settings.ts";
import { listAppToolSettingRows } from "./app-tool-setting-rows.ts";
import {
  memorySettingFields,
  runtimeDescription,
} from "./memory-setting-fields.ts";

export const AI_FIELD_IDS = {
  approvalPolicy: "ai.approvalPolicy",
  automaticallyMentionAgents: "ai.automaticallyMentionAgents",
  transcriptView: "ai.transcriptView",
  defaultRuntime: "ai.defaultRuntime",
  acpAgent: "ai.acpAgent",
  defaultModel: "ai.defaultModel",
  thinking: "ai.thinking",
  memoryFolder: "ai.memoryFolder",
  memoryTimezone: "ai.memoryTimezone",
  memoryAutomaticCapture: "ai.memoryAutomaticCapture",
  memoryAutomaticRecall: "ai.memoryAutomaticRecall",
  memoryConsolidationEnabled: "ai.memoryConsolidationEnabled",
  memoryConsolidationRuntime: "ai.memoryConsolidationRuntime",
  memoryConsolidationAgent: "ai.memoryConsolidationAgent",
  memoryConsolidationModel: "ai.memoryConsolidationModel",
  handoffSummariesEnabled: "ai.handoffSummariesEnabled",
  handoffSummaryRuntime: "ai.handoffSummaryRuntime",
  handoffSummaryAgent: "ai.handoffSummaryAgent",
  handoffSummaryModel: "ai.handoffSummaryModel",
  appToolsEnabled: "ai.appToolsEnabled",
} as const;
export type AiSettingKey = keyof typeof AI_FIELD_IDS;
export const ACP_AGENT_LABELS = {
  codex: "Codex",
  cursor: "Cursor",
  opencode: "OpenCode",
  local: "Lapis AI",
} as const;
export const aiModelSourceId = (provider: string) => `ai.models.${provider}`;

export function createAiSettingsSection(
  app: App,
  current: AiPluginSettings,
): WorkspaceSettingsSection {
  const conversation: NonNullable<WorkspaceSettingsSection["fields"]> = [
    {
      id: AI_FIELD_IDS.approvalPolicy,
      type: "enum",
      title: "Action approvals",
      description:
        "Default for all chats in this vault. Agents can override it. Auto approval applies to offered one-time permissions; app and client restrictions still apply.",
      default: "ask",
      options: APPROVAL_POLICIES.map((p) => ({
        value: p.value,
        label: p.label,
      })),
    },
    {
      id: AI_FIELD_IDS.automaticallyMentionAgents,
      type: "boolean",
      title: "Automatically tag agents",
      description:
        "Keep the same agent tags in follow-up messages. You can also change this in the @ picker.",
      default: false,
    },
    {
      id: AI_FIELD_IDS.transcriptView,
      type: "enum",
      title: "Conversation view",
      description:
        "Document or classic presentation of the same conversation. Saved for this vault.",
      default: DEFAULT_AI_SETTINGS.transcriptView,
      options: [
        { value: "document", label: "Document" },
        { value: "classic", label: "Classic" },
      ],
    },
  ];
  const runtime: typeof conversation = [
    {
      id: AI_FIELD_IDS.defaultRuntime,
      type: "enum",
      title: "Default runtime",
      description: runtimeDescription(
        "Automatic selection uses ACP; you can also pin ACP explicitly.",
        current.defaultRuntime,
      ),
      default: DEFAULT_AI_SETTINGS.defaultRuntime,
      allowUnknownOptions: true,
      options: [
        { value: "auto", label: "Automatic" },
        { value: "acp", label: "ACP" },
      ],
    },
    {
      id: AI_FIELD_IDS.acpAgent,
      type: "enum",
      title: "ACP agent",
      description:
        "ACP agent used for new bindings. External agents require their own installed prerequisites.",
      default: DEFAULT_AI_SETTINGS.acpAgent,
      options: ACP_AGENT_IDS.map((value) => ({
        value,
        label: ACP_AGENT_LABELS[value],
      })),
    },
    {
      id: AI_FIELD_IDS.defaultModel,
      type: "string",
      title: "Default model",
      description:
        "Model reported by the selected agent provider and sent on the next request.",
      default: current.defaultModel,
      optionsSource: aiModelSourceId(current.acpAgent),
      allowUnknownOptions: false,
    },
    {
      id: AI_FIELD_IDS.thinking,
      type: "enum",
      title: "Thinking",
      description: "How much model reasoning to request on each turn.",
      default: DEFAULT_AI_SETTINGS.thinking,
      options: [
        { value: "off", label: "Off" },
        { value: "default", label: "Provider default" },
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
  ];
  const memory = memorySettingFields(current);
  const tools: typeof conversation = [
    {
      id: AI_FIELD_IDS.appToolsEnabled,
      type: "boolean",
      title: "Application tools",
      description:
        "Expose enabled application tools to new agent bindings. Existing bindings keep their frozen tool list.",
      default: DEFAULT_AI_SETTINGS.appToolsEnabled,
    },
    {
      id: "ai.appTools",
      type: "group",
      presentation: "toggle-table",
      title: "Registered tools",
      description:
        "Enable or disable each currently registered tool for new agent bindings.",
      fields: listAppToolSettingRows(app, current).map((row) => ({
        id: row.fieldId,
        type: "boolean",
        title: row.name,
        description: row.description,
        default: row.owner.source !== "community",
      })),
    },
  ];
  return {
    id: "ai",
    title: "AI",
    description:
      "Conversation preferences, agent defaults, memory and history.",
    icon: "sparkles",
    order: 35,
    navigationGroupId: "core-plugins",
    sourcePluginId: "ai",
    fields: [
      {
        id: "ai.conversation",
        type: "group",
        title: "Conversation",
        fields: conversation,
      },
      {
        id: "ai.runtime",
        type: "group",
        title: "Runtime and model",
        fields: runtime,
      },
      {
        id: "ai.memory",
        type: "group",
        title: "Memory",
        fields: memory.filter((field) => !field.id.startsWith("ai.handoff")),
      },
      {
        id: "ai.handoff",
        type: "group",
        title: "Handoff summaries",
        fields: memory.filter((field) => field.id.startsWith("ai.handoff")),
      },
      {
        id: "ai.tools",
        type: "group",
        title: "Application tools",
        fields: tools,
      },
    ],
  };
}
