// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import type { AppDatabase } from "@lapis-notes/api/app-database";
import {
  canonicalConversationJson as canonicalJson,
  transcriptEntryHash,
} from "../conversations/hashes.ts";
import { deterministicMemoryId } from "./memory-id.ts";
import type { NativeMemoryHost } from "./native-memory-host.ts";
import { dedupeEvidence } from "./search-ranking.ts";
import type { MemoryEvidenceRef, MemoryScope } from "./types.ts";

export type MemoryCandidateRecord = Awaited<
  ReturnType<AppDatabase["queryMemoryCandidates"]>
>[number];

export type CandidateOrigin = {
  conversationId: string;
  entryId: string;
  entryHash: string;
  observedAt: number;
};

export async function resolveCandidateEvidence(
  host: NativeMemoryHost,
  origins: CandidateOrigin[],
): Promise<MemoryEvidenceRef[] | null> {
  const refs: MemoryEvidenceRef[] = [];
  for (const origin of origins) {
    const matches = (await host.repository.listAll()).filter(
      (entry) => entry.location.conversationId === origin.conversationId,
    );
    if (matches.length !== 1 || matches[0]?.unavailableReason) return null;
    const snapshot = await host.repository.read(matches[0]!.location);
    const entry = snapshot.transcript.find(
      (candidate) => candidate.id === origin.entryId,
    );
    if (!entry || entry.type !== "message" || entry.role !== "user") {
      return null;
    }
    const hash = await transcriptEntryHash(entry);
    if (hash !== origin.entryHash) return null;
    refs.push({
      conversationId: origin.conversationId,
      entryId: origin.entryId,
      entryHash: hash,
      observedAt: entry.createdAt,
      scopeDirAtObservation: snapshot.location.scopeDir,
    });
  }
  return dedupeEvidence(refs);
}

export async function markCandidatePromoted(
  host: NativeMemoryHost,
  candidate: MemoryCandidateRecord,
  memoryId: string,
): Promise<void> {
  await host.database.upsertMemoryCandidate({
    candidate: {
      ...candidate.candidate,
      state: "promoted",
      promotedMemoryId: memoryId,
    },
    origins: candidate.origins,
  });
}

export async function writeConsolidationReview(
  host: NativeMemoryHost,
  scope: MemoryScope,
  candidateId: string,
  outcome: "needs-review" | "written",
  origins: Array<{
    conversationId: string;
    entryId: string;
    entryHash: string;
  }>,
  reason: string,
  details: {
    expectedPreimageHash?: string;
    memoryId?: string;
    resultingRevision?: number;
    resultingRevisionHash?: string;
  } = {},
): Promise<void> {
  const jobId = await deterministicMemoryId(
    "review",
    candidateId,
    host.now().toISOString(),
  );
  const frontmatter = {
    schemaVersion: 1,
    jobId,
    scope,
    candidateIds: [candidateId],
    outcome,
    ...details,
    evidence: origins.map((origin) => ({
      conversationId: origin.conversationId,
      entryId: origin.entryId,
      entryHash: origin.entryHash,
    })),
    createdAt: host.now().toISOString(),
  };
  await host.recordStore
    .writeReview(
      scope,
      jobId,
      `---\n${canonicalJson(frontmatter)}\n---\n\n# Memory consolidation review\n\n${reason}\n`,
    )
    .catch(() => undefined);
}
