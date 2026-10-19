import {
  adoptionRequest,
  type AdoptionService,
  type AdoptionState,
  type AdoptionRecovery,
} from "./adoption.ts";
type Guard = <T>(action: () => Promise<T>) => Promise<T | undefined>;
/** An explicit ancestry import never replaces current vault files or its source. */
export class AdoptionController {
  #state: AdoptionState = { busy: false, phase: "ready" };
  #closed = false;
  #listeners = new Set<(state: AdoptionState) => void>();
  #activity = new Set<(state: { busy: boolean; phase: string }) => void>();
  #pending = new Set<Promise<unknown>>();
  constructor(
    readonly service: AdoptionService,
    readonly recovery: AdoptionRecovery,
    readonly feedback: { report(error: unknown): void; recovered(): void },
    readonly guard: Guard = (action) => action(),
  ) {}
  subscribe(listener: (state: AdoptionState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  subscribeActivity(
    listener: (state: { busy: boolean; phase: string }) => void,
  ) {
    this.#activity.add(listener);
    this.#announce();
    return () => this.#activity.delete(listener);
  }
  #set(patch: Partial<AdoptionState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #announce() {
    for (const listener of this.#activity)
      listener({ busy: this.#pending.size > 0, phase: this.#state.phase });
  }
  #run(phase: string, action: () => Promise<void | boolean>) {
    if (this.#closed || this.#state.busy) return Promise.resolve(false);
    this.#set({ busy: true, phase });
    const job = (async () => {
      try {
        const accepted = await action();
        if (accepted !== false && !this.#closed) this.feedback.recovered();
        return accepted !== false;
      } catch (error) {
        if (!this.#closed) this.feedback.report(error);
        return false;
      } finally {
        this.#set({ busy: false, phase: "ready" });
      }
    })();
    const tracked = job.finally(() => {
      this.#pending.delete(tracked);
      this.#announce();
    });
    this.#pending.add(tracked);
    this.#announce();
    return tracked;
  }
  refresh() {
    return this.#run("loading", async () => {
      const request = await this.recovery.load();
      const data = await this.service.status();
      this.#set({ data, request: request ?? data.pending ?? undefined });
      if (data.source_unavailable) {
        this.feedback.report(
          new Error(
            "Original repository history could not be inspected. Pending import recovery remains available.",
          ),
        );
        return false;
      }
    });
  }
  adopt() {
    if (this.#state.request || !this.#state.data?.source)
      return Promise.resolve(false);
    const request = adoptionRequest({
      request_id: crypto.randomUUID(),
      source: this.#state.data.source,
    });
    return this.#run("importing", async () => {
      const accepted = await this.guard(async () => {
        if (this.#closed) return;
        await this.recovery.save(request);
        this.#set({ request });
        const data = await this.service.adopt(request);
        await this.recovery.save(undefined);
        this.#set({ data, request: undefined });
        return true;
      });
      return accepted === true;
    });
  }
  resume() {
    const request = this.#state.request;
    if (!request) return Promise.resolve(false);
    return this.#run("recovering", async () => {
      const accepted = await this.guard(async () => {
        if (this.#closed) return;
        const data = await this.service.adopt(request);
        await this.recovery.save(undefined);
        this.#set({ data, request: undefined });
        return true;
      });
      return accepted === true;
    });
  }
  stop() {
    const request = this.#state.request;
    if (!request) return Promise.resolve(false);
    return this.#run("stopping", async () => {
      const accepted = await this.guard(async () => {
        if (this.#closed) return;
        const data = await this.service.stop(request.request_id);
        await this.recovery.save(undefined);
        this.#set({ data, request: undefined });
        return true;
      });
      return accepted === true;
    });
  }
  close() {
    this.#closed = true;
    this.#listeners.clear();
  }
  async drained() {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }
}
