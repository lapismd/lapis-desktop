// SPDX-License-Identifier: Apache-2.0
import { assertExecutionMode } from "../core/agent-profile.ts";
import { assertConversationWritable } from "./import-types.ts";
import {
  conversationStorageKey,
  type TranscriptStore,
  type ConversationWriteQueue,
} from "./transcript-store.ts";
import type { ConversationLocation } from "./types.ts";

export function validateExecutionModes(value: unknown): Record<string, string> {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid conversation permissions");
  const entries = Object.entries(value);
  if (entries.length > 32)
    throw new Error("Conversation permission limit exceeded");
  for (const [id, mode] of entries) {
    if (!id || id.length > 256 || /[\x00-\x1f\x7f]/u.test(id))
      throw new Error("Invalid permission participant");
    assertExecutionMode(mode);
    if (mode === undefined) throw new Error("Missing execution mode");
  }
  return Object.fromEntries(entries) as Record<string, string>;
}
export class ConversationPermissions {
  constructor(
    private readonly store: TranscriptStore,
    private readonly queue: ConversationWriteQueue,
    private readonly changed: (location: ConversationLocation) => void,
  ) {}
  write(location: ConversationLocation, participant: string, mode?: string) {
    assertExecutionMode(mode);
    return this.queue.run(conversationStorageKey(location), async () => {
      const snapshot = await this.store.read(location);
      assertConversationWritable(snapshot.metadata);
      if (snapshot.metadata.pendingTurn || snapshot.metadata.pendingDispatch)
        throw new Error(
          "Wait for the active turn to settle before changing permissions",
        );
      const modes = new Map(
        Object.entries(
          validateExecutionModes(snapshot.metadata.executionModes),
        ),
      );
      if (mode) modes.set(participant, mode);
      else modes.delete(participant);
      const metadata = {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      };
      const next = validateExecutionModes(Object.fromEntries(modes));
      if (Object.keys(next).length) metadata.executionModes = next;
      else delete metadata.executionModes;
      await this.store.writeMetadata(location, metadata);
      this.changed(location);
      return next;
    });
  }
}
