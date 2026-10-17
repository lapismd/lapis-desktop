// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import type { AcpAgentId } from "../settings/acp-agents.ts";

export type ComposerAgentSelection = {
  agent: AcpAgentId;
  runtimePreference: "acp" | "codex-native" | "opencode-native" | "fake";
  label: string;
};

const KNOWN: Record<string, ComposerAgentSelection> = {
  codex: { agent: "codex", runtimePreference: "acp", label: "Codex ACP" },
  "codex-acp": {
    agent: "codex",
    runtimePreference: "acp",
    label: "Codex ACP",
  },
  cursor: { agent: "cursor", runtimePreference: "acp", label: "Cursor ACP" },
  "cursor-acp": {
    agent: "cursor",
    runtimePreference: "acp",
    label: "Cursor ACP",
  },
  native: {
    agent: "codex",
    runtimePreference: "codex-native",
    label: "Codex Native",
  },
  "codex-native": {
    agent: "codex",
    runtimePreference: "codex-native",
    label: "Codex Native",
  },
  opencode: {
    agent: "opencode",
    runtimePreference: "acp",
    label: "OpenCode ACP",
  },
  "opencode-acp": {
    agent: "opencode",
    runtimePreference: "acp",
    label: "OpenCode ACP",
  },
  "opencode-native": {
    agent: "opencode",
    runtimePreference: "opencode-native",
    label: "OpenCode Native",
  },
  fake: { agent: "codex", runtimePreference: "fake", label: "Fake" },
};

export function composerAgentLabel(
  agent?: string,
  runtimePreference?: string,
): string {
  if (runtimePreference === "fake") return "Fake";
  if (runtimePreference === "codex-native") return "Codex Native";
  if (runtimePreference === "opencode-native") return "OpenCode Native";
  return agent === "cursor"
    ? "Cursor ACP"
    : agent === "opencode"
      ? "OpenCode ACP"
      : "Codex ACP";
}

export function parseAgentCommand(
  raw: string,
): ComposerAgentSelection | "status" | "unknown" {
  const name = raw.trim().toLowerCase();
  if (!name) return "status";
  return KNOWN[name] ?? "unknown";
}
