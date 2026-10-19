// SPDX-License-Identifier: Apache-2.0
// Retained Lapis conversation summaries; see ../NOTICE.md.
import type { ConversationRepository } from "./conversation-repository.ts";
import { messageEvidence } from "./comment-receipt.ts";
import { transcriptEntryHash, transcriptRangeHash } from "./hashes.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type ConversationLocation,
  type HandoffSummaryCreatedRecord,
  type TranscriptEntry,
} from "./types.ts";
import {
  SUMMARY_THRESHOLD_TOKENS,
  RECENT_TAIL_TOKENS,
  MAX_SUMMARY_INPUT_TOKENS,
  MAX_SUMMARY_OUTPUT_TOKENS,
  type GroundedHandoffSummaryInput,
  type HandoffSummaryProcessorIdentity,
  type HandoffSummaryProvider,
} from "./handoff-summary-contract.ts";
export class HandoffSummaryCoordinator {
  readonly #running = new Set<string>();

  constructor(
    private readonly repository: ConversationRepository,
    private readonly provider: HandoffSummaryProvider,
    private readonly processor:
      | HandoffSummaryProcessorIdentity
      | (() => HandoffSummaryProcessorIdentity),
    private readonly enabled: () => boolean = () => true,
  ) {}

  async afterTerminal(location: ConversationLocation): Promise<void> {
    if (!this.enabled()) return;
    const key = `${location.scopeDir}\u0000${location.conversationId}`;
    if (this.#running.has(key)) return;
    this.#running.add(key);
    try {
      const snapshot = await this.repository.read(location);
      const input = await buildSummaryInput(
        snapshot.metadata.id,
        snapshot.transcript,
      );
      if (!input) return;
      const duplicate = snapshot.agents.some(
        (record) =>
          record.type === "handoff.summary.created" &&
          record.sourceHash === input.sourceHash,
      );
      if (duplicate) return;
      const processor =
        typeof this.processor === "function"
          ? this.processor()
          : this.processor;
      const proposal = await this.provider.propose(input);
      const summary = proposal.summary.trim();
      if (!summary || estimatedTokens(summary) > MAX_SUMMARY_OUTPUT_TOKENS) {
        throw new Error(
          "Handoff summary output is empty or exceeds its limit.",
        );
      }
      const record: HandoffSummaryCreatedRecord = {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        type: "handoff.summary.created",
        id: `handoff-summary-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        conversationId: input.conversationId,
        fromEntryId: input.fromEntryId,
        throughEntryId: input.throughEntryId,
        sourceHash: input.sourceHash,
        summary,
        processor: { ...processor },
        estimatedTokens: estimatedTokens(summary),
      };
      await this.repository.appendAgentRecords(location, [record]);
    } finally {
      this.#running.delete(key);
    }
  }
}

async function buildSummaryInput(
  conversationId: string,
  transcript: readonly TranscriptEntry[],
): Promise<GroundedHandoffSummaryInput | undefined> {
  const projected = transcript.map(summaryEntry);
  const totalTokens = projected.reduce(
    (total, entry) => total + (entry ? estimatedTokens(entry.content) : 0),
    0,
  );
  if (totalTokens <= SUMMARY_THRESHOLD_TOKENS) return undefined;

  let prefixTokens = 0;
  let throughIndex = -1;
  for (let index = 0; index < transcript.length; index += 1) {
    const entry = projected[index];
    prefixTokens += entry ? estimatedTokens(entry.content) : 0;
    throughIndex = index;
    if (
      totalTokens - prefixTokens <= RECENT_TAIL_TOKENS ||
      prefixTokens >= MAX_SUMMARY_INPUT_TOKENS
    ) {
      break;
    }
  }
  const range = transcript.slice(0, throughIndex + 1);
  const entries = await Promise.all(
    projected.slice(0, throughIndex + 1).flatMap((entry, index) =>
      entry
        ? [
            transcriptEntryHash(transcript[index]!).then((hash) => ({
              ...entry,
              hash,
            })),
          ]
        : [],
    ),
  );
  if (entries.length === 0) return undefined;
  return {
    conversationId,
    fromEntryId: range[0]!.id,
    throughEntryId: range.at(-1)!.id,
    sourceHash: await transcriptRangeHash(range),
    entries,
  };
}

function summaryEntry(
  entry: TranscriptEntry,
): Omit<GroundedHandoffSummaryInput["entries"][number], "hash"> | undefined {
  if (entry.type === "message") {
    return {
      id: entry.id,
      type: entry.type,
      role: entry.role,
      agentBindingId: entry.agentBindingId,
      content: messageEvidence(entry),
    };
  }
  if (entry.type === "tool") {
    return {
      id: entry.id,
      type: entry.type,
      agentBindingId: entry.agentBindingId,
      content: JSON.stringify({
        trust: "untrusted",
        name: entry.name,
        state: entry.state,
        input: entry.input,
        output: entry.output,
        redacted: entry.redacted,
        truncated: entry.truncated,
      }),
    };
  }
  if (
    entry.type === "agent.switch" ||
    entry.type === "agent.config" ||
    entry.type === "command" ||
    entry.type === "error" ||
    entry.type === "cancelled"
  ) {
    return {
      id: entry.id,
      type: entry.type,
      agentBindingId: entry.agentBindingId,
      content: JSON.stringify(entry),
    };
  }
  return undefined;
}

function estimatedTokens(value: string): number {
  return Math.max(1, Math.ceil([...value].length / 4));
}
