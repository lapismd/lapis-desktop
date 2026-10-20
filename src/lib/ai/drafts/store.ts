// SPDX-License-Identifier: Apache-2.0
import type { Vault } from "@lapis-notes/api/vault";
import { emptyDraft, parseDraft, type ConversationDraft } from "./model.ts";
export const DRAFT_DIRECTORY = ".lapis/agents/drafts";
const MAX_BYTES = 2 * 1024 * 1024;
/** Vault-owned private drafts; no transcript publication or runtime allocation. */
export class ConversationDraftStore {
  readonly #cache = new Map<string, ConversationDraft>();
  readonly #pending = new Map<string, Promise<void>>();
  readonly #failed = new Map<string, unknown>();
  readonly #invalid = new Map<string, unknown>();
  constructor(private readonly vault?: Vault) {}
  private async path(key: string) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(key),
    );
    return `${DRAFT_DIRECTORY}/${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")}.json`;
  }
  async read(key: string): Promise<ConversationDraft> {
    if (this.#cache.has(key)) return structuredClone(this.#cache.get(key)!);
    let draft = emptyDraft();
    if (this.vault) {
      const path = await this.path(key);
      if (await this.vault.adapter.exists(path)) {
        const raw = await this.vault.adapter.read(path);
        if (new TextEncoder().encode(raw).byteLength > MAX_BYTES)
          throw new Error("Saved draft exceeds the supported size");
        const data = JSON.parse(raw);
        if (data.version !== 1 || data.key !== key)
          throw new Error(
            "Saved draft identity does not match this conversation",
          );
        draft = parseDraft(data.draft);
      }
    }
    // A late disk read cannot overwrite a more recent editor save.
    if (!this.#cache.has(key)) this.#cache.set(key, draft);
    return structuredClone(this.#cache.get(key)!);
  }
  save(key: string, value: ConversationDraft): Promise<void> {
    let draft: ConversationDraft;
    try {
      draft = parseDraft(value);
    } catch (error) {
      this.#invalid.set(key, error);
      return Promise.reject(error);
    }
    const content = JSON.stringify({ version: 1, key, draft });
    if (new TextEncoder().encode(content).byteLength > MAX_BYTES) {
      const error = new Error("Draft exceeds the supported size");
      this.#cache.set(key, draft);
      this.#invalid.set(key, error);
      return Promise.reject(error);
    }
    this.#invalid.delete(key);
    if (
      JSON.stringify(this.#cache.get(key)) === JSON.stringify(draft) &&
      !this.#failed.has(key)
    )
      return this.#pending.get(key) ?? Promise.resolve();
    this.#cache.set(key, draft);
    const previous = this.#pending.get(key) ?? Promise.resolve();
    const operation = previous
      .catch(() => {})
      .then(async () => {
        if (this.vault) {
          await this.vault.mkpath(DRAFT_DIRECTORY);
          const path = await this.path(key);
          const file = this.vault.getFileByPath(path);
          if (file) await this.vault.modify(file, content);
          else await this.vault.create(path, content);
        }
        this.#failed.delete(key);
      })
      .catch((error) => {
        this.#failed.set(key, error);
        throw error;
      })
      .finally(() => {
        if (this.#pending.get(key) === operation) this.#pending.delete(key);
      });
    this.#pending.set(key, operation);
    return operation;
  }
  async drain(): Promise<void> {
    await Promise.allSettled(
      [...this.#failed.keys()].map((key) =>
        this.save(key, this.#cache.get(key)!),
      ),
    );
    while (this.#pending.size) await Promise.allSettled(this.#pending.values());
    if (this.#failed.size || this.#invalid.size)
      throw new AggregateError(
        [...this.#failed.values(), ...this.#invalid.values()],
        "Conversation drafts could not be saved",
      );
  }
}
