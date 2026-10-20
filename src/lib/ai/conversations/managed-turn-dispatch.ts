import type {
  NativeDispatchInput,
  NativeDispatchPort,
  NativeDispatchView,
} from "./dispatch-port.ts";
import type { ManagedTurnState } from "./managed-turn-types.ts";
import { sameCanonicalConversation } from "./catalog-pages.ts";

/** Native status can be inspected repeatedly; Begin and launch never replay. */
export class ManagedTurnDispatch {
  #beginning?: Promise<NativeDispatchView>;
  #stopping?: Promise<void>;
  constructor(
    private readonly port: NativeDispatchPort,
    private readonly handle: string,
    private readonly state: () => ManagedTurnState,
    private readonly publish: (view: NativeDispatchView) => void,
  ) {}
  #accept(view: NativeDispatchView): NativeDispatchView {
    const state = this.state();
    if (
      view.requestId !== state.nativeRequestId ||
      !sameCanonicalConversation(view.conversation, state.conversation) ||
      view.recipients.length !== state.deliveries.length ||
      (view.authored !== null) !== (state.authorship !== "not-required") ||
      (state.authored &&
        view.authored?.messageId !== state.authored.messageId) ||
      view.recipients.some((recipient, index) => {
        const delivery = state.deliveries[index]!;
        return (
          recipient.requestId !== delivery.id ||
          recipient.participant?.profileId !==
            delivery.participant?.profileId ||
          (delivery.preparation &&
            recipient.targetId !== delivery.preparation.targetId) ||
          (delivery.sessionId &&
            recipient.binding !== null &&
            recipient.binding.worker !== delivery.sessionId)
        );
      })
    )
      throw new Error("Native dispatch changed its original identity");
    this.publish(view);
    return view;
  }
  begin(input: NativeDispatchInput): Promise<NativeDispatchView> {
    return (this.#beginning ??= this.port
      .begin(this.handle, input)
      .then((view) => {
        this.#accept(view);
        if (!view.fresh)
          throw new Error(
            "Native dispatch is retained; inspect or stop it without resuming",
          );
        return view;
      }));
  }
  async status(): Promise<NativeDispatchView | null> {
    const state = this.state();
    const view = await this.port.status(
      this.handle,
      state.conversation.threadId,
      state.nativeRequestId,
    );
    return view === null ? null : this.#accept(view);
  }
  stop(beforeClose: () => Promise<void>): Promise<void> {
    if (!this.#beginning) return Promise.resolve();
    return (this.#stopping ??= this.#stop(beforeClose).catch((error) => {
      this.#stopping = undefined;
      throw error;
    }));
  }
  async #stop(beforeClose: () => Promise<void>) {
    // Even a lost Begin reply retains its original identity for explicit Stop.
    await this.#beginning!.catch(() => undefined);
    const state = this.state();
    const fenced = this.#accept(
      await this.port.fence(
        this.handle,
        state.conversation.threadId,
        state.nativeRequestId,
      ),
    );
    if (!fenced.stopRequested)
      throw new Error("Native dispatch fence is not confirmed");
    await beforeClose();
    const view = this.#accept(
      await this.port.stop(
        this.handle,
        state.conversation.threadId,
        state.nativeRequestId,
      ),
    );
    if (!view.stopRequested || !view.stopped || !view.settled)
      throw new Error("Native dispatch stop is not confirmed");
  }
}
