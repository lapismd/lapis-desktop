// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
export const ACP_AGENT_IDS = ["codex", "cursor", "opencode", "local"] as const;

export type AcpAgentId = (typeof ACP_AGENT_IDS)[number];
export const PROCESSOR_AGENT_IDS = ["codex", "cursor", "local"] as const;
export type ProcessorAgentId = (typeof PROCESSOR_AGENT_IDS)[number];

export const DEFAULT_ACP_AGENT: AcpAgentId = "codex";

export function isAcpAgentId(value: unknown): value is AcpAgentId {
  return ACP_AGENT_IDS.some((id) => id === value);
}

export function normalizeAcpAgent(value: unknown): AcpAgentId {
  return isAcpAgentId(value) ? value : DEFAULT_ACP_AGENT;
}

export function normalizeProcessorAgent(value: unknown): ProcessorAgentId {
  return PROCESSOR_AGENT_IDS.find((id) => id === value) ?? "codex";
}

export function catalogModelsForAgent<T extends { provider?: string }>(
  agent: AcpAgentId,
  models: T[],
): T[] {
  return models.filter((model) => model.provider === agent || !model.provider);
}
