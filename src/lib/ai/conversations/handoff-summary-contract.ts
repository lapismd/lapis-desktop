// SPDX-License-Identifier: Apache-2.0
// Retained Lapis conversation summaries; see ../NOTICE.md.
export const SUMMARY_THRESHOLD_TOKENS = 12_000;
export const RECENT_TAIL_TOKENS = 9_000;
export const MAX_SUMMARY_INPUT_TOKENS = 24_000;
export const MAX_SUMMARY_OUTPUT_TOKENS = 3_000;
export const DEFAULT_TIMEOUT_MS = 60_000;

export type GroundedHandoffSummaryInput = {
  conversationId: string;
  fromEntryId: string;
  throughEntryId: string;
  sourceHash: string;
  entries: Array<{
    id: string;
    hash: string;
    type: string;
    role?: "user" | "assistant";
    agentBindingId?: string;
    content: string;
  }>;
};

export interface HandoffSummaryProvider {
  propose(
    input: GroundedHandoffSummaryInput,
    signal?: AbortSignal,
  ): Promise<{ summary: string }>;
}

export type HandoffSummaryProcessorIdentity = {
  runtime: "acp";
  agent: "codex" | "cursor" | "local";
  model: string;
};
