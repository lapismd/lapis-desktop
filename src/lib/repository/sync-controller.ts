import type { RemoteService } from "./remote.ts";
import {
  pendingSync,
  type PendingSync,
  type SyncResolution,
  type SyncService,
  type SyncState,
} from "./sync.ts";
export class SyncController {
  #state: SyncState = {
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  };
  #listeners = new Set<(state: SyncState) => void>();
  #closed = false;
  #job?: Promise<void>;
  #pending?: PendingSync;
  #revision = 0;
  #failure?: string;
  #conflictKey?: string;
  #operations = new Set<Promise<unknown>>();
  constructor(
    readonly remote: RemoteService,
    readonly service: SyncService,
    readonly guard: <T>(action: () => Promise<T>) => Promise<T>,
    readonly feedback: { report(error: unknown): void; recovered(): void },
    readonly recovery: {
      load(): Promise<unknown>;
      save(pending?: PendingSync): Promise<void>;
    },
  ) {}
  subscribe(listener: (state: SyncState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<SyncState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  setEnabled(enabled: boolean) {
    if (this.#state.enabled === enabled) return;
    this.#set({ enabled, phase: enabled ? "ready" : "paused" });
  }
  run(): Promise<void> {
    if (
      this.#closed ||
      !this.#state.enabled ||
      (this.#state.busy && !this.#job)
    )
      return Promise.resolve();
    return (this.#job ??= this.#track(this.#execute()).finally(() => {
      this.#job = undefined;
    }));
  }
  async #applyPending() {
    if (!this.#pending) return;
    const original = this.#pending;
    this.#set({ phase: "applying", recovery: true });
    await this.guard(async () => {
      if (!this.#closed)
        await this.service.apply(original.request, original.revision);
    });
    if (this.#closed) return;
    await this.recovery.save(undefined);
    if (this.#pending === original) this.#pending = undefined;
    this.#set({ recovery: false });
  }
  async #execute() {
    this.#set({ busy: true, phase: "fetching" });
    try {
      if (!this.#pending) {
        const stored = await this.recovery.load();
        this.#pending = pendingSync(stored);
        if (stored != null && !this.#pending) {
          this.#set({ recovery: true });
          throw new Error(
            "Saved synchronization recovery is invalid; keep current files before synchronizing again",
          );
        }
      }
      if (this.#closed) return;
      await this.#applyPending();
      if (this.#closed || !this.#state.enabled) return;
      let remote = await this.remote.status();
      if (this.#closed || !this.#state.enabled) return;
      if (!remote.configuration) {
        this.#set({ phase: "ready" });
        this.#recovered();
        return;
      }
      if (remote.publication && this.remote.publication) {
        remote = await this.remote.publication.observe(
          remote.revision,
          remote.publication.request_id,
        );
        if (this.#closed || !this.#state.enabled) return;
        if (
          remote.publication &&
          (remote.publication.outcome !== "prepared" ||
            !remote.configuration?.canPush)
        )
          throw new Error(
            "The original push still needs observation; local history is safe",
          );
      }
      if (!remote.configuration) return;
      this.#revision = remote.revision;
      const proposal = await this.service.prepare(remote.revision);
      if (this.#closed || !this.#state.enabled) return;
      this.#set({ proposal: proposal ?? undefined, conflict: undefined });
      if (proposal?.conflicts.length) {
        this.#set({ phase: "conflicts" });
        if (this.#conflictKey !== proposal.candidate?.commit) {
          this.#conflictKey = proposal.candidate?.commit;
          this.#report(
            new Error(
              "Backup has conflicts. Open Backup settings to review them.",
            ),
          );
        }
        return;
      }
      if (proposal?.candidate) {
        await this.guard(async () => {
          if (this.#closed || !this.#state.enabled) return;
          const current = await this.remote.status();
          if (this.#closed || !this.#state.enabled) return;
          if (current.revision !== remote.revision)
            throw new Error("Backup connection changed; synchronize again");
          const preview = await this.service.preview(
            proposal.candidate!.commit,
            remote.revision,
          );
          if (this.#closed || !this.#state.enabled) return;
          this.#pending = {
            version: 1,
            revision: remote.revision,
            request: {
              request_id: crypto.randomUUID(),
              checkpoint: preview.checkpoint,
              expected: preview.expected,
            },
          };
          await this.recovery.save(this.#pending);
          if (this.#closed) return;
          this.#set({ phase: "applying", recovery: true });
          await this.service.apply(
            this.#pending.request,
            this.#pending.revision,
          );
          if (this.#closed) return;
          await this.recovery.save(undefined);
          this.#pending = undefined;
          this.#set({ recovery: false });
        });
      }
      if (this.#closed || !this.#state.enabled) return;
      if (remote.configuration.canPush) {
        this.#set({ phase: "publishing" });
        const result = await this.service.publish(
          remote.revision,
          crypto.randomUUID(),
        );
        if (this.#closed) return;
        if (result !== "complete")
          throw new Error(
            result === "unknown"
              ? "The original push still needs observation; local history is safe"
              : result === "stopped"
                ? "The original push stopped tracking; synchronize again to create a new request"
                : "The remote advanced; synchronization will fetch and merge again",
          );
      }
      if (!this.#closed) {
        this.#set({
          phase: "ready",
          proposal: undefined,
          lastSuccess: Date.now(),
        });
        this.#recovered();
      }
    } catch (error) {
      if (!this.#closed) {
        this.#set({
          phase: "attention",
          recovery: this.#state.recovery || !!this.#pending,
        });
        this.#report(error);
      }
    } finally {
      this.#set({ busy: false });
    }
  }
  async inspect(path: string) {
    const proposal = this.#state.proposal;
    if (this.#closed || this.#state.busy || !proposal?.candidate) return;
    this.#set({ busy: true });
    try {
      const conflict = await this.#track(
        this.service.conflict(proposal.candidate.commit, path, this.#revision),
      );
      this.#set({ conflict });
    } catch (error) {
      if (!this.#closed) this.#report(error);
    } finally {
      this.#set({ busy: false });
    }
  }
  async resolve(path: string, resolution: SyncResolution) {
    const proposal = this.#state.proposal;
    if (this.#closed || this.#state.busy || !proposal?.candidate) return;
    this.#set({ busy: true });
    try {
      const candidate = await this.#track(
        this.service.resolve(
          proposal.candidate.commit,
          path,
          resolution,
          this.#revision,
        ),
      );
      if (this.#closed) return;
      this.#set({
        proposal: {
          ...proposal,
          candidate,
          conflicts: proposal.conflicts.filter((value) => value !== path),
        },
        conflict: undefined,
      });
      this.#recovered();
    } catch (error) {
      if (!this.#closed) this.#report(error);
    } finally {
      this.#set({ busy: false });
    }
    if (!this.#state.proposal?.conflicts.length) await this.run();
  }
  async keepCurrent() {
    if (this.#closed || this.#state.busy) return;
    this.#set({ busy: true });
    try {
      await this.#track(this.guard(() => this.remote.keepCurrent()));
      if (this.#closed) return;
      await this.recovery.save(undefined);
      this.#pending = undefined;
      this.#set({ recovery: false, phase: "ready" });
      this.#recovered();
    } catch (error) {
      if (!this.#closed) this.#report(error);
    } finally {
      this.#set({ busy: false });
    }
  }
  #report(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (this.#failure === message) return;
    this.#failure = message;
    this.feedback.report(error);
  }
  #recovered() {
    this.#failure = undefined;
    this.feedback.recovered();
  }
  close() {
    this.#closed = true;
    this.#listeners.clear();
  }
  #track<T>(job: Promise<T>): Promise<T> {
    this.#operations.add(job);
    void job.finally(() => this.#operations.delete(job)).catch(() => {});
    return job;
  }
  async drained() {
    while (this.#operations.size)
      await Promise.allSettled([...this.#operations]);
  }
}
