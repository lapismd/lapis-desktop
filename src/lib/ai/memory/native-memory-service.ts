// SPDX-License-Identifier: Apache-2.0
// Retained Lapis memory policy; see ../NOTICE.md.
import { captureMemoryTurn } from "./turn-capture.ts";
import { MemoryCaptureBoundary } from "./capture-port.ts";
import { InMemoryMemoryRecordStore } from "./memory-record-store.ts";
import {
  consolidateNativeMemory,
  previewConsolidation,
} from "./memory-consolidate.ts";
import {
  forgetConversation,
  previewForgetConversation,
  rebuildNativeMemory,
} from "./memory-forget.ts";
import { getNativeMemory } from "./memory-inspect.ts";
import { ingestConversation } from "./conversation-ingest.ts";
import { recallNativeMemory, searchNativeMemory } from "./memory-search.ts";
import {
  type NativeMemoryHost,
  type NativeMemoryServiceOptions,
} from "./native-memory-host.ts";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import type { AppDatabase } from "@lapis-notes/api/app-database";
import type { ConversationLocation } from "../conversations/types.ts";
import type { AgentContextBlock } from "../core/context.ts";
import type {
  ConsolidationPreview,
  ConsolidationResult,
  MemoryContext,
  MemoryDetail,
  MemoryForgetPreview,
  MemoryForgetResult,
  MemoryRebuildResult,
  MemoryScope,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryService,
} from "./types.ts";

export class NativeMemoryService implements MemoryService {
  readonly #host: NativeMemoryHost;

  constructor(
    repository: ConversationRepository,
    database: AppDatabase,
    options: NativeMemoryServiceOptions = {},
  ) {
    const boundary = new MemoryCaptureBoundary(options.capture);
    this.#host = {
      repository: boundary.port(repository, true),
      database: boundary.port(database),
      now: options.now ?? (() => new Date()),
      yieldToApp:
        options.yieldToApp ??
        (() => new Promise((resolve) => setTimeout(resolve, 0))),
      recordStore: boundary.port(
        options.recordStore ?? new InMemoryMemoryRecordStore(),
      ),
      consolidationProvider: options.consolidationProvider,
      captureEnabled: options.captureEnabled,
      promoteAfterTurn: options.promoteAfterTurn,
    };
  }

  async ingestConversation(location: ConversationLocation): Promise<void> {
    await ingestConversation(this.#host, location, false);
    if (
      (await this.#host.database.getMemorySourceState(location.conversationId))
        ?.status === "ready"
    )
      await captureMemoryTurn(this.#host, location);
  }

  async recoverCapture(): Promise<void> {
    for (const entry of await this.#host.repository.listAll())
      if (!entry.unavailableReason)
        await this.ingestConversation(entry.location);
  }

  search(
    query: MemorySearchQuery,
    context: MemoryContext,
    signal?: AbortSignal,
  ): Promise<MemorySearchResult[]> {
    return searchNativeMemory(this.#host, query, context, signal);
  }

  recall(
    query: string,
    context: MemoryContext,
    signal?: AbortSignal,
  ): Promise<AgentContextBlock[]> {
    return recallNativeMemory(this.#host, query, context, signal);
  }

  get(
    ref: string,
    context: MemoryContext,
    signal?: AbortSignal,
  ): Promise<MemoryDetail> {
    return getNativeMemory(this.#host, ref, context, signal);
  }

  rebuild(scope?: MemoryScope): Promise<MemoryRebuildResult> {
    return rebuildNativeMemory(this.#host, scope);
  }

  previewForgetConversation(
    location: ConversationLocation,
  ): Promise<MemoryForgetPreview> {
    return previewForgetConversation(this.#host, location);
  }

  forgetConversation(
    location: ConversationLocation,
  ): Promise<MemoryForgetResult> {
    return forgetConversation(this.#host, location);
  }

  previewConsolidation(scope: MemoryScope): Promise<ConsolidationPreview> {
    return previewConsolidation(this.#host, scope);
  }

  consolidate(scope: MemoryScope): Promise<ConsolidationResult> {
    return consolidateNativeMemory(this.#host, scope);
  }
}
