import type { AgentSession } from "../core/runtime.ts";
import type { AgentTurnOptions } from "../core/context.ts";
import { OwnedAiWork } from "../core/owned-work.ts";
import type {
  CanonicalConversationRead,
  OpenedConversationBackend,
} from "./backend-port.ts";
import { prepareManagedTurn } from "./managed-turn-preparation.ts";
import { ManagedTurnDispatch } from "./managed-turn-dispatch.ts";
import type { NativeDispatchView } from "./dispatch-port.ts";
import { sameCanonicalConversation } from "./catalog-pages.ts";
import {
  assertManagedTurn,
  initialManagedTurn,
  turnErrorText,
} from "./managed-turn-state.ts";
import type {
  ManagedAgentLauncher,
  ManagedTurnPort,
  ManagedTurnRecipient,
  ManagedTurnState,
  ManagedDeliveryState,
} from "./managed-turn-types.ts";

/** One explicit native turn; this is orchestration, never a transcript store. */
export class ManagedConversationTurn {
  readonly #work = new OwnedAiWork();
  readonly #startups = new OwnedAiWork();
  readonly #listeners = new Set<(state: ManagedTurnState) => void>();
  readonly #sessions = new Map<string, AgentSession>();
  readonly #reads = new Set<string>();
  readonly #opened: OpenedConversationBackend;
  readonly #read: Pick<CanonicalConversationRead, "identity" | "selection">;
  readonly #recipients: ManagedTurnRecipient[];
  readonly #dispatch: ManagedTurnDispatch;
  #state: ManagedTurnState;
  #prepared?: Promise<void>;
  #sending?: Promise<void>;
  #closed = false;
  #closing?: Promise<void>;
  constructor(
    private readonly port: ManagedTurnPort,
    opened: OpenedConversationBackend,
    private readonly launcher: ManagedAgentLauncher,
    read: CanonicalConversationRead,
    private readonly text: string,
    recipients: readonly ManagedTurnRecipient[],
  ) {
    if (opened.selection.backend !== "jj")
      throw new Error("Select native conversation storage first");
    assertManagedTurn(read, text, recipients);
    this.#opened = structuredClone(opened);
    this.#read = structuredClone({
      identity: read.identity,
      selection: read.selection,
    });
    this.#recipients = structuredClone([...recipients]);
    this.#state = initialManagedTurn(read, text, recipients);
    this.#dispatch = new ManagedTurnDispatch(
      port.dispatch,
      this.#opened.handle,
      () => this.state,
      (view) => this.#observeDispatch(view),
    );
  }
  get state(): ManagedTurnState {
    return structuredClone(this.#state);
  }
  subscribe(listener: (state: ManagedTurnState) => void): () => void {
    this.#assertOpen();
    this.#listeners.add(listener);
    listener(this.state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #assertOpen() {
    if (this.#closed) throw new Error("Native turn is closed");
  }
  #assertRunnable() {
    this.#assertOpen();
    if (this.#state.cancellationRequested)
      throw new Error("Native turn cancellation was requested");
  }
  #publish(patch: Partial<ManagedTurnState>) {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.state);
  }
  #delivery(index: number, patch: Partial<ManagedDeliveryState>) {
    this.#publish({
      deliveries: this.#state.deliveries.map((delivery, at) =>
        at === index ? { ...delivery, ...patch } : delivery,
      ),
    });
  }
  #observeDispatch(dispatch: NativeDispatchView) {
    this.#publish({
      dispatch,
      deliveries: this.#state.deliveries.map((delivery, index) => {
        const phase = dispatch.recipients[index]!.phase;
        return ["completed", "rejected", "unknown"].includes(phase)
          ? {
              ...delivery,
              phase: phase as "completed" | "rejected" | "unknown",
              error: undefined,
            }
          : delivery;
      }),
    });
  }
  dispatchStatus() {
    this.#assertOpen();
    return this.#work.run(() => this.#dispatch.status());
  }
  prepare(): Promise<void> {
    this.#assertRunnable();
    return (this.#prepared ??= this.#work.run(async () => {
      // Publish only after the single promise is registered, including reentrant listeners.
      await Promise.resolve();
      this.#assertRunnable();
      await prepareManagedTurn({
        port: this.port,
        launcher: this.launcher,
        handle: this.#opened.handle,
        read: this.#read,
        text: this.text,
        recipients: this.#recipients,
        state: () => this.state,
        assertOpen: () => this.#assertRunnable(),
        publish: (patch) => this.#publish(patch),
        delivery: (index, patch) => this.#delivery(index, patch),
        beginDispatch: (input) => this.#dispatch.begin(input),
        retainRead: (handle) => {
          this.#reads.add(handle);
        },
        releaseRead: (handle) => this.#releaseRead(handle),
      });
    }));
  }
  /** Observe only. A recovered receipt never retries preparation or dispatch. */
  authorshipStatus() {
    this.#assertOpen();
    return this.#work.run(async () => {
      const write = await this.port.authored.canonicalStatus(
        this.#opened.handle,
        this.#state.nativeRequestId,
        this.#read.identity.threadId,
      );
      if (
        write &&
        (write.requestId !== this.#state.nativeRequestId ||
          !sameCanonicalConversation(write.conversation, this.#read.identity))
      )
        throw new Error(
          "Native authorship status changed its original identity",
        );
      return write;
    });
  }
  send(
    options: Omit<AgentTurnOptions, "requestId"> = {},
    onSession?: (deliveryId: string, session: AgentSession) => void,
  ): Promise<void> {
    this.#assertRunnable();
    return (this.#sending ??= this.#work.run(async () => {
      await this.prepare();
      this.#assertRunnable();
      this.#publish({ phase: "running" });
      await Promise.allSettled(
        this.#recipients.map(async (recipient, index) => {
          const delivery = this.#state.deliveries[index]!;
          try {
            this.#assertRunnable();
            this.#delivery(index, { phase: "starting" });
            const session = await this.#startups.run(() =>
              this.launcher.start(delivery.preparation!, {
                ...recipient.request,
                prompt: "",
              }),
            );
            this.#sessions.set(delivery.id, session);
            this.#assertRunnable();
            this.#delivery(index, { phase: "running", sessionId: session.id });
            onSession?.(delivery.id, session);
            await session.send(this.text, {
              ...options,
              requestId: this.#state.requestId,
            });
          } catch (error) {
            this.#delivery(index, {
              phase: "unknown",
              error: turnErrorText(error),
            });
          }
        }),
      );
      let failure: unknown;
      try {
        const view = await this.#dispatch.status();
        if (
          !view ||
          !view.recipients.every((recipient) => recipient.phase === "completed")
        ) {
          this.#publish({
            deliveries: this.#state.deliveries.map((delivery) =>
              ["completed", "rejected"].includes(delivery.phase)
                ? delivery
                : { ...delivery, phase: "unknown" },
            ),
          });
          failure = new Error(
            "Some native deliveries did not complete; inspect their recorded outcomes",
          );
        }
      } catch (error) {
        failure = error;
      }
      this.#publish({
        phase: failure ? "failed" : "completed",
        ...(failure ? { error: turnErrorText(failure) } : {}),
      });
      if (failure) throw failure;
    }));
  }
  session(deliveryId: string): AgentSession | undefined {
    return this.#sessions.get(deliveryId);
  }
  async cancel(): Promise<void> {
    this.#publish({ cancellationRequested: true });
    await this.#dispatch.stop(async () => {
      await this.#startups.settle();
      // Local detach failure is resolved only by the subsequent confirmed
      // native close. A failed native close still retains the same turn.
      await Promise.allSettled(
        [...this.#sessions.values()].map((session) =>
          this.launcher.prepareStop(session),
        ),
      );
    });
  }
  async #releaseRead(handle: string) {
    await this.port.closeRead(this.#opened.handle, handle);
    this.#reads.delete(handle);
  }
  close(): Promise<void> {
    this.#closed = true;
    return (this.#closing ??= this.#stop().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  async #stop() {
    // Cancel before waiting for an active prompt; no late startup may dispatch.
    await this.cancel();
    const stopped = await Promise.allSettled(
      [...this.#sessions].map(async ([id, session]) => {
        await this.launcher.releaseStopped(session);
        this.#sessions.delete(id);
      }),
    );
    const stopErrors = stopped.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (stopErrors.length)
      throw new AggregateError(stopErrors, "Native turn cleanup failed");
    await this.#work.settle();
    // A startup racing Close is retained above but cannot pass #assertOpen/send.
    const results = await Promise.allSettled([
      ...[...this.#sessions].map(async ([id, session]) => {
        await this.launcher.releaseStopped(session);
        this.#sessions.delete(id);
      }),
      ...[...this.#reads].map((handle) => this.#releaseRead(handle)),
    ]);
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "Native turn cleanup failed");
    this.#publish({ phase: "closed" });
    this.#listeners.clear();
  }
}
