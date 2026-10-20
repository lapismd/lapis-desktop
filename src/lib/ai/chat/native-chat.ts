// SPDX-License-Identifier: Apache-2.0
import { OwnedAiWork } from "../core/owned-work.ts";
import type { AgentTurnOptions } from "../core/context.ts";
import type { UserInputAnswers } from "../core/approvals.ts";
import type { TranscriptItem } from "@lapismd/design-core/chat";
import type {
  CanonicalConversationIdentity,
  CanonicalConversationRead,
  ConversationBackendPort,
} from "../conversations/backend-port.ts";
import type { NativeConversationReader } from "../conversations/native-reader.ts";
import type { ManagedConversationTurn } from "../conversations/managed-turn.ts";
import type {
  ManagedTurnRecipient,
  ManagedTurnState,
} from "../conversations/managed-turn-types.ts";
import { sameCanonicalConversation } from "../conversations/catalog-pages.ts";
import { NativeLiveSession } from "./native-live-session.ts";
import { projectNativeLive } from "./native-live-projection.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";

export type NativeChatState = {
  busy: boolean;
  stopping: boolean;
  blocked: boolean;
  turn?: ManagedTurnState;
  live: TranscriptItem[];
  pending: {
    delivery: string;
    item: NativeLiveSession["items"][number];
    responding: boolean;
    supported: boolean;
  }[];
  authorshipUnknown: boolean;
};
export class NativeConversationChat {
  readonly #work = new OwnedAiWork();
  readonly #consumers = new OwnedAiWork();
  readonly #listeners = new Set<(state: NativeChatState) => void>();
  readonly #sessions = new Map<string, NativeLiveSession>();
  #state: NativeChatState = {
    busy: false,
    stopping: false,
    blocked: false,
    live: [],
    pending: [],
    authorshipUnknown: false,
  };
  #turn?: ManagedConversationTurn;
  #identity?: CanonicalConversationIdentity;
  #closed = false;
  #closing?: Promise<void>;
  #unsubscribe?: () => void;
  #finishing?: Promise<void>;
  constructor(
    readonly reader: {
      readonly state: Pick<
        NativeConversationReader["state"],
        "conversation" | "reading"
      >;
    } & Pick<NativeConversationReader, "selectRoute" | "reconcile">,
    private readonly port: ConversationBackendPort,
    private readonly handle: string,
    private readonly createTurn: (
      read: CanonicalConversationRead,
      text: string,
      recipients: readonly ManagedTurnRecipient[],
    ) => ManagedConversationTurn,
    private readonly profiles: () => readonly AgentRecipientOption[],
    readonly report: (error: unknown) => void,
    private readonly alive: () => boolean = () => true,
  ) {}
  get state() {
    return {
      ...this.#state,
      turn: this.#state.turn ? structuredClone(this.#state.turn) : undefined,
      live: [...this.#state.live],
      pending: this.#state.pending.map((value) => ({
        ...value,
        item: structuredClone(value.item),
      })),
    };
  }
  subscribe(listener: (state: NativeChatState) => void) {
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #publish(patch: Partial<NativeChatState> = {}) {
    this.#state = {
      ...this.#state,
      ...patch,
      live: projectNativeLive(this.#sessions.values(), this.profiles()),
      pending: [...this.#sessions].flatMap(([delivery, live]) =>
        live.pending.map((item) => ({
          delivery,
          item,
          responding: live.responding(item.id),
          supported:
            item.type !== "question" || !!live.session.respondToQuestion,
        })),
      ),
    };
    if (!this.#closed && this.alive())
      for (const listener of this.#listeners) listener(this.state);
  }
  #assertOpen() {
    if (this.#closed || !this.alive()) throw new Error("Native chat is closed");
  }
  submit(
    text: string,
    recipients: readonly ManagedTurnRecipient[],
    options: Omit<AgentTurnOptions, "requestId"> = {},
  ): Promise<boolean> {
    this.#assertOpen();
    if (
      this.#state.busy ||
      this.#state.blocked ||
      this.#state.authorshipUnknown
    )
      return Promise.reject(
        new Error(
          "Resolve the previous native turn before sending another message",
        ),
      );
    const read = this.reader.state.conversation;
    if (!read || this.reader.state.reading || !text.trim())
      return Promise.reject(
        new Error("Choose a ready native conversation and enter a message"),
      );
    if (/^\/(?!\/)/u.test(text.trimStart()))
      return Promise.reject(
        new Error("Native conversation commands are not connected yet"),
      );
    this.#publish({ busy: true });
    return this.#work.run(async () => {
      let turn: ManagedConversationTurn | undefined;
      try {
        await Promise.resolve();
        this.#assertOpen();
        this.#finishing = undefined;
        turn = this.createTurn(read, text, recipients);
        this.#turn = turn;
        this.#identity = structuredClone(read.identity);
        this.#unsubscribe?.();
        this.#unsubscribe = turn.subscribe((state) =>
          this.#publish({ turn: state }),
        );
        await turn.prepare();
        this.#assertOpen();
        await this.reader.selectRoute(read.identity, true);
        this.#assertOpen();
        const running = this.#run(turn, options);
        void this.#work
          .run(() => running)
          .catch((error) => {
            if (!this.#closed) this.report(error);
          });
        return true;
      } catch (error) {
        if (!this.#closed) this.report(error);
        this.#publish({
          authorshipUnknown: turn?.state.authorship === "unknown",
        });
        if (turn) await this.#finish(turn);
        else this.#publish({ busy: false });
        return turn?.state.authorship === "confirmed";
      }
    });
  }
  async #run(
    turn: ManagedConversationTurn,
    options: Omit<AgentTurnOptions, "requestId">,
  ) {
    try {
      await turn.send(options, (id, session) => {
        const delivery = turn.state.deliveries.find(
          (value) => value.id === id,
        )!;
        const live = new NativeLiveSession(
          delivery,
          session,
          () =>
            !this.#closed &&
            this.alive() &&
            this.#turn === turn &&
            !turn.state.cancellationRequested,
          () => this.#publish(),
        );
        this.#sessions.set(id, live);
        void this.#consumers
          .run(() => live.consume())
          .catch((error) => {
            if (!this.#closed && !turn.state.cancellationRequested)
              this.report(error);
          });
      });
    } finally {
      await this.#finish(turn);
    }
  }
  #finish(turn: ManagedConversationTurn): Promise<void> {
    return (this.#finishing ??= this.#drainTurn(turn));
  }
  async #drainTurn(turn: ManagedConversationTurn) {
    try {
      await turn.close();
      await this.#consumers.settle();
      if (!this.#closed && this.alive() && this.#identity) {
        await this.reader.reconcile(
          this.#identity,
          turn.state.deliveries
            .filter((delivery) => delivery.sessionId)
            .map((delivery) => delivery.id),
          () => {
            this.#sessions.clear();
            this.#publish();
          },
        );
      }
      this.#publish({ busy: false, stopping: false, blocked: false });
    } catch (error) {
      this.#publish({ busy: false, stopping: false, blocked: true });
      throw error;
    }
  }
  stop(): Promise<void> {
    this.#assertOpen();
    const turn = this.#turn;
    if (!turn) return Promise.resolve();
    if (this.#state.blocked) this.#finishing = undefined;
    this.#publish({ stopping: true });
    return this.#work.run(() => this.#finish(turn));
  }
  respond(delivery: string, item: string, answer: string | UserInputAnswers) {
    this.#assertOpen();
    const live = this.#sessions.get(delivery);
    if (!live)
      return Promise.reject(new Error("The native interaction has expired"));
    return this.#work.run(() => live.respond(item, answer));
  }
  recoverAuthorship(): Promise<boolean> {
    this.#assertOpen();
    return this.#work.run(async () => {
      const state = this.#state.turn;
      if (!state || !this.#state.authorshipUnknown) return false;
      const result = await this.port.authored.canonicalStatus(
        this.handle,
        state.nativeRequestId,
        state.conversation.threadId,
      );
      if (!result) return false;
      if (
        result.requestId !== state.nativeRequestId ||
        !sameCanonicalConversation(result.conversation, state.conversation) ||
        !result.receipt
      )
        throw new Error("Original native authorship is not confirmed");
      await this.reader.selectRoute(state.conversation, true);
      this.#publish({ authorshipUnknown: false });
      return true; // Observe only. Never restart the retained dispatch.
    });
  }
  close(): Promise<void> {
    this.#closed = true;
    this.#listeners.clear();
    this.#unsubscribe?.();
    return (this.#closing ??= (async () => {
      if (this.#turn) await this.#turn.close();
      await this.#work.settle();
      await this.#consumers.settle();
    })().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
