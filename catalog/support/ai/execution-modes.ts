import type { ExecutionMode } from "../../../src/lib/ai/core/agent-profile.ts";
import type { AiPluginSettings } from "../../../src/lib/ai/settings/ai-settings.ts";
/** Deliberate fixture capabilities; these never assert a real provider's modes. */
export const reviewExecutionModes: ExecutionMode[] = [
  {
    id: "read-only",
    name: "Ask before actions",
    description: "Review actions before allowing them.",
  },
  {
    id: "fixture-edit",
    name: "Workspace edits",
    description: "Simulated provider mode for reviewing this picker.",
  },
];

export const modesForReview = (scenario: string) =>
  scenario === "mode-menu"
    ? [
        { id: "plan", name: "Plan" },
        { id: "build", name: "Build" },
      ]
    : reviewExecutionModes;

export const modeReviewSettings = (
  scenario: string,
  settings: AiPluginSettings,
): AiPluginSettings =>
  scenario === "mode-menu"
    ? { ...settings, acpAgent: "opencode", defaultModel: "opencode/big-pickle" }
    : settings;
