// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI orchestration; see ../NOTICE.md.
import { OwnedAiWork, type AiWorkRunner } from "../core/owned-work.ts";
import { conversationLocationFromSourcePath } from "./source-path.ts";
import type { ConversationLocation } from "./types.ts";

type ConversationIndexWriter = {
  sync(location: ConversationLocation): Promise<void>;
  delete(location: ConversationLocation): Promise<void>;
};

type PendingIndexAction = {
  type: "sync" | "delete";
  location: ConversationLocation;
};

export type ConversationIndexErrorHandler = (
  operation: "sync" | "delete",
  location: ConversationLocation,
  error: unknown,
) => void;

function locationKey(location: ConversationLocation): string {
  return `${location.scopeDir}\u0000${location.conversationId}`;
}

export class ConversationIndexCoordinator {
  readonly #work: OwnedAiWork;
  #disposed = false;
  readonly #pending = new Map<string, PendingIndexAction>();
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly index: ConversationIndexWriter,
    private readonly onError: ConversationIndexErrorHandler = () => {},
    private readonly delay = 150,
    activity?: AiWorkRunner,
  ) {
    this.#work = new OwnedAiWork(activity);
  }

  handleVaultChange(path: string, oldPath?: string): void {
    if (this.#disposed) return;
    const next = conversationLocationFromSourcePath(path);
    const previous = oldPath
      ? conversationLocationFromSourcePath(oldPath)
      : null;
    if (previous && (!next || locationKey(previous) !== locationKey(next))) {
      this.#pending.set(locationKey(previous), {
        type: "delete",
        location: previous,
      });
    }
    if (next) {
      this.#pending.set(locationKey(next), { type: "sync", location: next });
    }
    if (!next && !previous) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, this.delay);
  }

  flush(): Promise<void> {
    return this.#work.run(() => this.#flush());
  }
  settle(): Promise<void> {
    return this.#work.settle();
  }
  async #flush(): Promise<void> {
    if (this.#disposed) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    const actions = [...this.#pending.values()];
    this.#pending.clear();
    for (const action of actions) {
      if (this.#disposed) return;
      if (action.type === "delete") {
        await this.#delete(action.location);
        continue;
      }
      try {
        await this.index.sync(action.location);
      } catch (error) {
        if (this.#disposed) return;
        this.onError("sync", action.location, error);
        await this.#delete(action.location);
      }
    }
  }

  dispose(): void {
    this.#disposed = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#pending.clear();
  }

  async #delete(location: ConversationLocation): Promise<void> {
    try {
      await this.index.delete(location);
    } catch (error) {
      this.onError("delete", location, error);
    }
  }
}
