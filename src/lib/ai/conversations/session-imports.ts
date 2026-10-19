// SPDX-License-Identifier: Apache-2.0
import type {
  ConversationWriteQueue,
  TranscriptStore,
} from "./transcript-store.ts";
import { conversationStorageKey } from "./transcript-store.ts";
import { canonicalConversationJson } from "./hashes.ts";
import { planSessionImport } from "./import-plan.ts";
import type { CapturedSession, SessionImportPlan } from "./import-types.ts";
import type {
  ConversationLocation,
  ConversationMetadata,
  ConversationSnapshot,
} from "./types.ts";
import type { DurableSanitizationOptions } from "./redaction.ts";
import { normalizeConversationScope } from "./paths.ts";

export function assertSameImport(
  actual: ConversationMetadata,
  expected: ConversationMetadata,
): void {
  if (
    !actual.imported ||
    !expected.imported ||
    canonicalConversationJson({ ...actual.imported, state: null }) !==
      canonicalConversationJson({ ...expected.imported, state: null })
  )
    throw new Error(
      "The import destination has different source provenance or content",
    );
}
export function assertImportPrefix(
  s: ConversationSnapshot,
  p: SessionImportPlan,
): void {
  assertSameImport(s.metadata, p.metadata);
  if (
    s.warnings.length ||
    s.agents.length ||
    s.transcript.length > p.entries.length ||
    canonicalConversationJson(s.transcript) !==
      canonicalConversationJson(p.entries.slice(0, s.transcript.length))
  )
    throw new Error(
      "The import destination is corrupt or differs from the captured prefix",
    );
  if (
    s.metadata.imported?.state === "complete" &&
    s.transcript.length !== p.entries.length
  )
    throw new Error("The completed import is missing captured entries");
}
export class SessionImports {
  constructor(
    private readonly store: TranscriptStore,
    private readonly queue: ConversationWriteQueue,
    private readonly changed: (l: ConversationLocation) => void,
    private readonly sanitization: DurableSanitizationOptions,
  ) {}
  preview(capture: CapturedSession, scopeDir: string) {
    return planSessionImport(capture, scopeDir, this.sanitization);
  }
  async save(capture: CapturedSession, scopeDir: string) {
    const scope = normalizeConversationScope(scopeDir);
    const plan = await this.preview(capture, scope);
    const location = { scopeDir: scope, conversationId: plan.metadata.id };
    return this.queue.run(conversationStorageKey(location), async () => {
      if (!this.store.prepareImport)
        throw new Error(
          "The selected transcript backend does not support local imports",
        );
      let snapshot = await this.store.prepareImport(location, plan.metadata);
      assertImportPrefix(snapshot, plan);
      const duplicate = snapshot.metadata.imported?.state === "complete";
      if (!duplicate) {
        await this.store.appendTranscriptEntries(
          location,
          plan.entries.slice(snapshot.transcript.length),
        );
        snapshot = await this.store.read(location);
        assertImportPrefix(snapshot, plan);
        if (snapshot.transcript.length !== plan.entries.length)
          throw new Error("Import entries are not confirmed");
        await this.store.writeMetadata(location, {
          ...snapshot.metadata,
          imported: { ...plan.metadata.imported, state: "complete" },
        });
        snapshot = await this.store.read(location);
        assertImportPrefix(snapshot, plan);
        if (snapshot.metadata.imported?.state !== "complete")
          throw new Error("Import completion is not confirmed");
      }
      this.changed(location);
      return { snapshot, duplicate };
    });
  }
}
