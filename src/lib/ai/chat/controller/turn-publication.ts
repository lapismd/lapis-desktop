import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AgentRequest } from "../../core/runtime.ts";
/** The composer acknowledges durable authoring separately from provider completion. */
export class TurnPublication {
  inFlight = false;
  private active: Promise<unknown> = Promise.resolve();
  whenSettled() {
    return this.active;
  }
  private pending?: { resolve: (accepted: boolean) => void };
  private failed: (e: unknown) => void = () => {};
  constructor(private controller: AiChatController) {}
  configure(failed: (e: unknown) => void) {
    this.failed = failed;
  }
  prepared() {
    this.pending?.resolve(true);
  }
  async submit(prompt: string, request: Omit<AgentRequest, "prompt">) {
    if (
      this.pending ||
      this.inFlight ||
      this.controller.busy ||
      this.controller._disposed
    )
      return false;
    let resolve!: (accepted: boolean) => void;
    const admitted = new Promise<boolean>((r) => (resolve = r)),
      pending = { resolve };
    this.pending = pending;
    const sending = this.controller._backgroundWork.run(() =>
      this.controller.submit(prompt, request),
    );
    this.inFlight = true;
    this.active = sending
      .then((result) => {
        if (result === true) pending.resolve(true);
        if (
          !this.controller._disposed &&
          result !== true &&
          this.controller.error
        ) {
          const error = new Error(this.controller.error);
          this.controller.error = null;
          this.failed(error);
        }
      })
      .catch((e) => {
        if (!this.controller._disposed) this.failed(e);
      })
      .finally(() => {
        this.inFlight = false;
        resolve(false);
      });
    try {
      return await admitted;
    } finally {
      if (this.pending === pending) this.pending = undefined;
    }
  }
}
