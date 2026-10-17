// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { TranscriptStore } from "../conversations/transcript-store.ts";
import { VaultTranscriptStore } from "../conversations/vault-transcript-store.ts";

/** One explicit backend for an AI application's lifetime; never a fallback writer. */
export interface ConversationPersistence {
  readonly backend: string;
  readonly store: TranscriptStore;
  /** Await durable publication or reject with retained recovery information. */
  drain(): Promise<void>;
}
export type ConversationPersistenceFactory = (
  app: App,
) => ConversationPersistence;
const bindings = new WeakMap<
  App,
  { factory: ConversationPersistenceFactory }
>();

/** Bind before plugin loading. Allocation remains lazy for disabled/Safe Mode. */
export function bindConversationPersistence(
  app: App,
  factory: ConversationPersistenceFactory,
): () => void {
  if (bindings.has(app))
    throw new Error("Conversation persistence is already bound to this App");
  const lease = { factory };
  bindings.set(app, lease);
  return () => {
    if (bindings.get(app) === lease) bindings.delete(app);
  };
}

export function ownedConversationPersistence(
  app: App,
): ConversationPersistence {
  const binding = bindings.get(app);
  if (binding) return binding.factory(app);
  // Compatibility selection for existing installations. An injected failure
  // must propagate; it must never enter this legacy backend.
  return {
    backend: "vault-files",
    store: new VaultTranscriptStore(app.vault),
    drain: async () => {},
  };
}
