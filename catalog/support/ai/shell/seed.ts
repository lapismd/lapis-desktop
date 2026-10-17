// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
import { shellLayout } from "./layout.ts";
import { conversationSeed } from "./conversations.ts";
import { conversationFiles, binding, message } from "./records.ts";
import {
  LOCAL_CONVERSATION_ID,
  RECOVERY_CONVERSATION_ID,
  FOLLOW_NEAR_CONVERSATION_ID,
  FOLLOW_FAR_CONVERSATION_ID,
  LIVE_HOST_RELOAD_CONVERSATION_ID,
  type ShellScenario,
} from "./types.ts";
const AI_WORKSPACE_CONFIGURATION = {
  "appearence.interface.showTabTitleBar": true,
};
const AI_WORKSPACE_PLUGIN_DATA = {
  settings: {
    defaultRuntime: "acp",
    acpAgent: "codex",
    defaultModel: "gpt-5.6-sol",
    thinking: "medium",
  },
};
export function shellSeed(
  pluginData = AI_WORKSPACE_PLUGIN_DATA,
  scenario: ShellScenario = "default",
): Record<string, string> {
  const initialLocation =
    scenario === "agent-switching" ||
    scenario === "registry-chat" ||
    scenario === "registry-overview"
      ? { scopeDir: "Notes", conversationId: LOCAL_CONVERSATION_ID }
      : scenario === "recovery"
        ? { scopeDir: "Notes", conversationId: RECOVERY_CONVERSATION_ID }
        : scenario === "reload-resume"
          ? {
              scopeDir: "Notes",
              conversationId: LIVE_HOST_RELOAD_CONVERSATION_ID,
            }
          : undefined;
  return {
    ".lapis/app.json": JSON.stringify(AI_WORKSPACE_CONFIGURATION, null, 2),
    ".lapis/workspace.json": JSON.stringify(
      shellLayout(initialLocation, scenario),
      null,
      2,
    ),
    ".lapis/ai.json": JSON.stringify(pluginData, null, 2),
    "Notes/Welcome.md": "# Welcome\n\nAsk the AI chat in the workspace.\n",
    "Notes/alpha.md": "# Alpha\n\nTODO: summarize this note.\n",
    ...(scenario === "registry-overview"
      ? {
          "Notes/.agents/skills/daily/SKILL.md": [
            "---",
            "name: daily",
            "description: Plan and review the current daily note",
            "---",
            "",
            "Use the active note and linked project context.",
            "",
          ].join("\n"),
          "Notes/.agents/commands/review.md": [
            "---",
            "description: Review the current note for gaps",
            "kind: prompt",
            "---",
            "",
            "Review the active note and list the next action.",
            "",
          ].join("\n"),
          ...conversationSeed(scenario),
        }
      : scenario === "follow-scope"
        ? {
            "Projects/work.md": "# Work\n\nActive project note.\n",
            "Projects/Atlas/note.md": "# Atlas\n\nNested project note.\n",
            ...conversationFiles({
              scopeDir: "Projects",
              id: FOLLOW_NEAR_CONVERSATION_ID,
              title: "Near folder chat",
              status: "active",
              bindings: [binding("binding-near", "codex", "gpt-5.6-sol")],
              activeBindingId: "binding-near",
              transcript: [
                message(
                  "near-user",
                  "user",
                  "Stay in Projects",
                  "binding-near",
                ),
                message(
                  "near-assistant",
                  "assistant",
                  "The near folder chat is open.",
                  "binding-near",
                ),
              ],
            }),
            ...conversationFiles({
              scopeDir: "Projects/Atlas",
              id: FOLLOW_FAR_CONVERSATION_ID,
              title: "Atlas folder chat",
              status: "active",
              bindings: [binding("binding-far", "codex", "gpt-5.6-sol")],
              activeBindingId: "binding-far",
              transcript: [
                message("far-user", "user", "Stay in Atlas", "binding-far"),
                message(
                  "far-assistant",
                  "assistant",
                  "The deeper Atlas chat is open.",
                  "binding-far",
                ),
              ],
            }),
          }
        : scenario === "default" ||
            scenario === "community-tools" ||
            scenario === "reload-resume"
          ? {}
          : conversationSeed(scenario)),
  };
}
