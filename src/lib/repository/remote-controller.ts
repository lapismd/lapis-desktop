import type {
  RemoteService,
  RemoteSnapshot,
  RemoteViewState,
} from "./remote.ts";
export class RemoteController {
  readonly service: RemoteService;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  #state: RemoteViewState = { busy: false, phase: "ready" };
  #closed = false;
  #listeners = new Set<(state: RemoteViewState) => void>();
  #activity = new Set<(state: { busy: boolean; phase: string }) => void>();
  #pending = new Set<Promise<unknown>>();
  constructor(service: RemoteService, feedback: RemoteController["feedback"]) {
    this.service = service;
    this.feedback = feedback;
  }
  subscribe(listener: (state: RemoteViewState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  subscribeActivity(
    listener: (state: { busy: boolean; phase: string }) => void,
  ) {
    this.#activity.add(listener);
    listener({ busy: this.#pending.size > 0, phase: this.#state.phase });
    return () => this.#activity.delete(listener);
  }
  #set(patch: Partial<RemoteViewState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #announce() {
    for (const listener of this.#activity)
      listener({ busy: this.#pending.size > 0, phase: this.#state.phase });
  }
  #run(phase: string, action: () => Promise<RemoteSnapshot>): Promise<boolean> {
    if (this.#closed || this.#state.busy) return Promise.resolve(false);
    this.#set({ busy: true, phase });
    const job = (async () => {
      try {
        const data = await action();
        if (this.#closed) return false;
        this.#set({ data });
        this.feedback.recovered();
        return true;
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
    return this.#run("loading", () => this.service.status());
  }
  configure(account: string, project: string, branch?: string) {
    return this.#run("connecting", () =>
      this.service.configure(
        this.#state.data?.revision ?? 0,
        account,
        project.trim(),
        branch?.trim(),
      ),
    );
  }
  fetch() {
    if (!this.#state.data?.configuration) return Promise.resolve(false);
    return this.#run("fetching", () =>
      this.service.fetch(this.#state.data!.revision),
    );
  }
  disconnect() {
    if (!this.#state.data?.configuration) return Promise.resolve(false);
    return this.#run("disconnecting", () =>
      this.service.disconnect(this.#state.data!.revision),
    );
  }
  observePublication(requestId: string) {
    if (!this.service.publication || !this.#state.data)
      return Promise.resolve(false);
    return this.#run("observing", () =>
      this.service.publication!.observe(this.#state.data!.revision, requestId),
    );
  }
  stopPublication(requestId: string) {
    if (!this.service.publication || !this.#state.data)
      return Promise.resolve(false);
    return this.#run("stopping", () =>
      this.service.publication!.stop(this.#state.data!.revision, requestId),
    );
  }
  close() {
    this.#closed = true;
    this.#listeners.clear();
  }
  async drained() {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }
}
