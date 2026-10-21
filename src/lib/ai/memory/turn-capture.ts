// SPDX-License-Identifier: Apache-2.0
import type { NativeMemoryHost } from "./native-memory-host.ts";
import type {
  ConversationSnapshot,
  ConversationLocation,
} from "../conversations/types.ts";
import { extractDeterministicCandidates } from "./candidate-extractor.ts";
import { consolidateNativeMemory } from "./memory-consolidate.ts";
import { memoryScopeKey } from "./paths.ts";
import type { MemoryScope } from "./types.ts";

export async function captureMemoryTurn(
  host: NativeMemoryHost,
  location: ConversationLocation,
): Promise<void> {
  if (
    (await host.recordStore.listExcludedConversationIds()).has(
      location.conversationId,
    )
  )
    return;
  const snapshot = await host.repository.read(location);
  if (!completedMemoryTurn(snapshot)) return;
  const eligible = host.recordStore.eligibleEntries
    ? new Set(
        await host.recordStore.eligibleEntries(
          location,
          snapshot.transcript.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt,
          })),
        ),
      )
    : new Set(snapshot.transcript.map((entry) => entry.id));
  if (!eligible.size) return;
  if (host.captureEnabled?.() === false) {
    await host.recordStore.checkpointEntries?.(location, [...eligible]);
    return;
  }
  await extractDeterministicCandidates(snapshot, host.database, {
    entries: snapshot.transcript.filter((entry) => eligible.has(entry.id)),
  });
  if (host.promoteAfterTurn) {
    const scopes = new Map<string, MemoryScope>();
    for (const {
      candidate,
      origins,
    } of await host.database.queryMemoryCandidates({
      states: ["staged"],
      limit: 10_000,
    })) {
      if (
        !origins.some(
          (origin) => origin.conversationId === location.conversationId,
        )
      )
        continue;
      const scope: MemoryScope =
        candidate.scopeKind === "project"
          ? { kind: "project", projectDir: candidate.scopePath }
          : { kind: candidate.scopeKind };
      scopes.set(memoryScopeKey(scope), scope);
    }
    for (const scope of scopes.values()) {
      const result = await consolidateNativeMemory(host, scope, false);
      if (result.needsReview && result.written === 0)
        throw new Error(
          "Memory capture needs review; the capture checkpoint was retained for retry",
        );
    }
  }
  const pending = new Set(
    (
      await host.database.queryMemoryCandidates({
        states: ["staged"],
        limit: 10_000,
      })
    ).flatMap(({ origins }) =>
      origins
        .filter((origin) => origin.conversationId === location.conversationId)
        .map((origin) => origin.entryId),
    ),
  );
  await host.recordStore.checkpointEntries?.(
    location,
    [...eligible].filter((id) => !pending.has(id)),
  );
}

export function completedMemoryTurn(snapshot: ConversationSnapshot): boolean {
  if (snapshot.metadata.pendingTurn || snapshot.metadata.pendingDispatch)
    return false;
  const last = [...snapshot.transcript]
    .reverse()
    .find((entry) => entry.type !== "system.notice" && entry.type !== "tool");
  return Boolean(
    last &&
      (last.type === "error" ||
        last.type === "cancelled" ||
        (last.type === "message" && last.role === "assistant")),
  );
}
