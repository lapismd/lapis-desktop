export type BackupCheckpoint = {
  operation: string;
  commit: string;
  change_id: string;
  description: string;
  timestamp_millis: number;
};
export type BackupStatus = {
  phase: "saving" | "ready" | "failed" | "closed";
  checkpoint: BackupCheckpoint | null;
  error: string | null;
};
export interface BackupService {
  start(changed: (status: BackupStatus) => void): Promise<BackupStatus>;
  capture(): Promise<BackupStatus>;
  stop(): Promise<void>;
}
/** Plugin owns this independently of the optional status-bar contribution. */
export class BackupController {
  #state: BackupStatus = { phase: "saving", checkpoint: null, error: null };
  #listeners = new Set<(status: BackupStatus) => void>();
  #closed = false;
  #running = false;
  #attempted = false;
  #epoch = 0;
  readonly service: BackupService;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(
    service: BackupService,
    feedback: { report(error: unknown): void; recovered(): void },
  ) {
    this.service = service;
    this.feedback = feedback;
  }
  subscribe(listener: (status: BackupStatus) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(status: BackupStatus) {
    if (this.#closed) return;
    this.#state = status;
    if (status.phase === "failed")
      this.feedback.report(new Error(status.error ?? "Vault backup failed"));
    else if (status.phase === "ready") this.feedback.recovered();
    for (const listener of this.#listeners) listener(status);
  }
  async start() {
    if (this.#running || this.#closed) return;
    // A lost response can leave a native owner. Drain it before admitting a
    // replacement rather than treating an unknown stop as successful.
    if (this.#attempted) await this.pause();
    if (this.#closed) return;
    this.#running = true;
    this.#attempted = true;
    const epoch = ++this.#epoch;
    try {
      let events = 0;
      const initial = await this.service.start((state) => {
        if (epoch !== this.#epoch) return;
        events++;
        this.#set(state);
      });
      if (events === 0 && epoch === this.#epoch) this.#set(initial);
    } catch (error) {
      if (epoch !== this.#epoch) return;
      this.#running = false;
      this.#set({
        ...this.#state,
        phase: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  async refresh() {
    if (this.#closed) return;
    this.#set({ ...this.#state, phase: "saving", error: null });
    if (!this.#running) {
      await this.start();
      return;
    }
    const epoch = this.#epoch;
    try {
      const result = await this.service.capture();
      if (epoch === this.#epoch) this.#set(result);
    } catch (error) {
      if (epoch !== this.#epoch) return;
      this.#set({
        ...this.#state,
        phase: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  async pause() {
    this.#epoch++;
    this.#running = false;
    try {
      if (this.#attempted) await this.service.stop();
    } catch (error) {
      this.#set({
        ...this.#state,
        phase: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    this.#attempted = false;
    this.#set({ ...this.#state, phase: "closed", error: null });
  }
  async close() {
    await this.pause();
    this.#closed = true;
    this.#listeners.clear();
  }
}
