// Adapted from jj-store web/src/lib/controller/integrations.svelte.ts (Apache-2.0).
import type {
  ForgeCommand,
  ForgeInventory,
  ForgeService,
  ForgeState,
} from "./forge-accounts.ts";
export class ForgeController {
  #state: ForgeState = { busy: false, flow: "" };
  #listeners = new Set<(state: ForgeState) => void>();
  #timer?: ReturnType<typeof setTimeout>;
  #epoch = 0;
  #closed = false;
  #pending = new Set<Promise<unknown>>();
  #activity = new Set<(state: { busy: boolean; phase: string }) => void>();
  readonly service: ForgeService;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(service: ForgeService, feedback: ForgeController["feedback"]) {
    this.service = service;
    this.feedback = feedback;
  }
  subscribe(listener: (state: ForgeState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  subscribeActivity(
    listener: (state: { busy: boolean; phase: string }) => void,
  ) {
    this.#activity.add(listener);
    listener({ busy: this.#pending.size > 0, phase: "connecting" });
    return () => this.#activity.delete(listener);
  }
  #track<T>(task: Promise<T>): Promise<T> {
    const tracked = task.finally(() => {
      this.#pending.delete(tracked);
      for (const listener of this.#activity)
        listener({ busy: this.#pending.size > 0, phase: "connecting" });
    });
    this.#pending.add(tracked);
    for (const listener of this.#activity)
      listener({ busy: true, phase: "connecting" });
    return tracked;
  }
  async drained() {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }
  #set(patch: Partial<ForgeState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  tokenFlow(flow: "pat" | "enterprise") {
    if (!this.#state.busy && !this.#closed) this.#set({ flow });
  }
  async refresh() {
    if (!this.#closed && !this.#state.busy) await this.#run();
  }
  async begin() {
    if (this.#closed || this.#state.busy) return;
    this.#set({ flow: "oauth" });
    await this.#run({ kind: "begin_oauth" });
  }
  async addToken(api_url: string, token: string) {
    return this.#run({ kind: "add_token", api_url, token });
  }
  async forget(account: string) {
    await this.#run({ kind: "forget", account });
  }
  #run(command?: ForgeCommand): Promise<boolean> {
    if (this.#closed || this.#state.busy) return Promise.resolve(false);
    const epoch = this.#epoch;
    this.#set({ busy: true });
    const task = (async () => {
      try {
        const incoming = command
          ? await this.service.command(command)
          : await this.service.inventory();
        if (epoch !== this.#epoch || this.#closed) {
          if (incoming.authorization?.state === "pending")
            await this.service.command({
              kind: "cancel_oauth",
              session: incoming.authorization.session,
            });
          return false;
        }
        const inventory: ForgeInventory = command
          ? incoming
          : {
              ...incoming,
              authorization: this.#state.inventory?.authorization ?? null,
            };
        this.#set({ inventory });
        this.feedback.recovered();
        if (
          command?.kind === "add_token" ||
          inventory.authorization?.state === "complete"
        )
          this.#set({ flow: "" });
        if (inventory.authorization?.state === "pending") this.#schedule();
        else if (
          inventory.authorization &&
          ["denied", "expired", "failed"].includes(
            inventory.authorization.state,
          )
        )
          this.feedback.report(
            new Error(
              `GitHub authorization ${inventory.authorization.state}. Start again for a new code.`,
            ),
          );
        return true;
      } catch (error) {
        if (epoch === this.#epoch && !this.#closed) this.feedback.report(error);
        return false;
      } finally {
        if (epoch === this.#epoch) this.#set({ busy: false });
      }
    })();
    return this.#track(task);
  }
  #schedule() {
    clearTimeout(this.#timer);
    const auth = this.#state.inventory?.authorization;
    if (!auth || auth.state !== "pending") return;
    this.#timer = setTimeout(
      () => void this.#run({ kind: "poll_oauth", session: auth.session }),
      Math.max(5, Math.min(60, auth.interval)) * 1000,
    );
  }
  async openAuthorization() {
    const url = this.#state.inventory?.authorization?.verification_uri;
    if (this.#closed || url !== "https://github.com/login/device") return;
    try {
      await this.service.openAuthorization(url);
    } catch (error) {
      if (!this.#closed) this.feedback.report(error);
    }
  }
  async cancel() {
    clearTimeout(this.#timer);
    this.#epoch++;
    const session = this.#state.inventory?.authorization?.session;
    this.#set({
      flow: "",
      busy: false,
      inventory: this.#state.inventory
        ? { ...this.#state.inventory, authorization: null }
        : undefined,
    });
    if (session)
      try {
        await this.#track(
          this.service.command({ kind: "cancel_oauth", session }),
        );
      } catch (error) {
        if (!this.#closed) this.feedback.report(error);
      }
  }
  async close() {
    if (this.#closed) return;
    this.#closed = true;
    this.#listeners.clear();
    await this.cancel();
    // Late responses remain fenced and cancel their private pending grant.
    // Account network work is installation-owned and cannot hold vault close.
  }
}
