import type {
  StorageLocation,
  StorageService,
  StorageState,
  StorageStatus,
} from "./storage.ts";
type Guard = <T>(action: () => Promise<T>) => Promise<T | undefined>;

/** An advanced move is explicit and retains native recovery until reload. */
export class StorageController {
  #state: StorageState = { busy: false, phase: "ready", needsReload: false };
  #closed = false;
  #listeners = new Set<(state: StorageState) => void>();
  #activity = new Set<(state: { busy: boolean; phase: string }) => void>();
  #pending = new Set<Promise<unknown>>();
  constructor(
    readonly service: StorageService,
    readonly feedback: { report(error: unknown): void; recovered(): void },
    readonly guard: Guard = (action) => action(),
  ) {}
  subscribe(listener: (state: StorageState) => void) {
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
  #set(patch: Partial<StorageState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  #announce() {
    for (const listener of this.#activity)
      listener({ busy: this.#pending.size > 0, phase: this.#state.phase });
  }
  #run(
    phase: string,
    action: () => Promise<StorageStatus>,
    mutate = false,
  ): Promise<boolean> {
    if (this.#closed || this.#state.busy) return Promise.resolve(false);
    this.#set({ busy: true, phase });
    let attempted = false;
    const job = (async () => {
      try {
        const data = mutate
          ? await this.guard(async () => {
              if (this.#closed) return undefined;
              attempted = true;
              return action();
            })
          : await action();
        if (!data) return false;
        this.#set({ data, needsReload: this.#state.needsReload || mutate });
        if (mutate) await this.service.reload();
        if (!this.#closed) this.feedback.recovered();
        return true;
      } catch (error) {
        if (attempted) {
          // A lost response may already have installed the selected layout.
          // Observe native recovery; never invent a second move request.
          try {
            this.#set({ data: await this.service.status(), needsReload: true });
          } catch {
            this.#set({ needsReload: true });
          }
        }
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
  reveal() {
    const data = this.#state.data;
    if (
      !data?.canReveal ||
      data.pending ||
      this.#state.needsReload ||
      !this.service.reveal
    )
      return Promise.resolve(false);
    return this.#run("revealing", () => this.service.reveal!(data.revision));
  }
  change(location: StorageLocation) {
    const data = this.#state.data;
    if (!data || data.pending || data.location === location)
      return Promise.resolve(false);
    const id = crypto.randomUUID();
    return this.#run(
      "moving",
      () => this.service.change(data.revision, location, id),
      true,
    );
  }
  recover() {
    return this.#run("recovering", () => this.service.recover(), true);
  }
  rollback() {
    const pending = this.#state.data?.pending;
    if (!pending) return Promise.resolve(false);
    return this.#run(
      "recovering",
      () => this.service.rollback(pending.request_id),
      true,
    );
  }
  reload() {
    return this.#run("reloading", async () => {
      await this.service.reload();
      return this.#state.data ?? (await this.service.status());
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
