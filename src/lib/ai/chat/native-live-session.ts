// SPDX-License-Identifier: Apache-2.0
import type { AgentSession } from "../core/runtime.ts";
import {
  requireApprovalOption,
  type UserInputAnswers,
} from "../core/approvals.ts";
import type { AiChatItem } from "./chat-items.ts";
import { StreamingChatTrace } from "./controller/streaming-trace.ts";
import { markApprovalResponse, markQuestionResponse } from "./chat-trace.ts";
import type { ManagedDeliveryState } from "../conversations/managed-turn-types.ts";

/** Ephemeral, already-captured ACP presentation. Never writes a transcript. */
export class NativeLiveSession {
  items: AiChatItem[] = [];
  readonly #decisions = new Map<string, string>();
  readonly #responding = new Set<string>();
  #ended = false;
  constructor(
    readonly delivery: ManagedDeliveryState,
    readonly session: AgentSession,
    private readonly active: () => boolean,
    private readonly changed: () => void,
  ) {}
  get pending() {
    return this.active() && !this.#ended
      ? this.items.filter(
          (item) =>
            (item.type === "approval" || item.type === "question") &&
            item.status === "pending",
        )
      : [];
  }
  async consume() {
    const trace = new StreamingChatTrace(
      () => this.items,
      (items) => {
        this.items = items;
        this.changed();
      },
      this.active,
    );
    try {
      for await (const event of this.session.events()) {
        if (!this.active()) break;
        if (event.type === "error") throw event.error;
        const occurrence = event.source
          ? `${event.source.runId}/${event.source.sequence}/${event.source.frameIndex ?? 0}`
          : crypto.randomUUID();
        trace.receive(
          event,
          undefined,
          (kind, provided) =>
            `native/live/${this.delivery.id}/${provided ?? `${kind}/${occurrence}`}${kind === "approval" || kind === "question" ? `/${occurrence}` : ""}`,
        );
      }
    } finally {
      trace.flush();
      trace.clear();
      this.#ended = true;
      this.changed();
    }
  }
  async respond(itemId: string, answer: string | UserInputAnswers) {
    const item = this.pending.find((value) => value.id === itemId);
    if (
      !item ||
      (item.type !== "approval" && item.type !== "question") ||
      this.#responding.has(itemId)
    )
      throw new Error("This native interaction is no longer pending");
    const decision = JSON.stringify(answer),
      previous = this.#decisions.get(itemId);
    if (previous !== undefined && previous !== decision)
      throw new Error(
        "Check the original interaction response before changing it",
      );
    if (item.type === "approval") {
      if (typeof answer !== "string")
        throw new Error("Choose an exact approval option");
      requireApprovalOption(item.request, answer);
    } else if (typeof answer === "string" || !this.session.respondToQuestion)
      throw new Error("This native agent cannot answer the question");
    this.#decisions.set(itemId, decision);
    this.#responding.add(itemId);
    this.changed();
    try {
      if (item.type === "approval")
        await this.session.respondToApproval(item.request.id, answer as string);
      else
        await this.session.respondToQuestion!(
          item.request.id,
          answer as UserInputAnswers,
        );
      // A late reply cannot update another request or another session.
      if (!this.active()) return;
      this.items = this.items.map((value) =>
        value.id !== itemId
          ? value
          : item.type === "approval"
            ? markApprovalResponse(
                [value],
                item.request.id,
                answer as string,
              )[0]!
            : markQuestionResponse([value], item.request.id)[0]!,
      );
    } finally {
      this.#responding.delete(itemId);
      this.changed();
    }
  }
  responding(id: string) {
    return this.#responding.has(id);
  }
}
