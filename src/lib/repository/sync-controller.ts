import { applyCandidate } from "./sync-application.ts";
import {
  observePublication,
  publishSync,
  refreshPublished,
} from "./sync-publication.ts";
import type { RemoteService } from "./remote.ts";
import {
  pendingSync,
  syncFeedback,
  idleSyncPhase,
  type PendingSync,
  type SyncResolution,
  type SyncService,
  type SyncState,
  type SyncAction,
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
  #resumeAction: SyncAction = "sync";
  #feedback: ReturnType<typeof syncFeedback>;
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
  ) {
    this.#feedback = syncFeedback(feedback);
  }
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
  run(action: SyncAction = "sync"): Promise<void> {
    if (
      this.#closed ||
      (action === "sync" && !this.#state.enabled) ||
      (this.#state.busy && !this.#job)
    )
      return Promise.resolve();
    return (this.#job ??= this.#track(this.#execute(action)).finally(() => {
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
  #cancelled(action: SyncAction) {
    return this.#closed || (action === "sync" && !this.#state.enabled);
  }
  async #execute(action: SyncAction) {
    this.#set({
      busy: true,
      phase: action === "status" ? this.#state.phase : "fetching",
    });
    try {
      if (action === "fetch" || action === "status") {
        let upstream = await this.remote.status();
        if (this.#closed) return;
        this.#set({ upstream });
        if (action === "fetch") {
          if (!upstream.configuration)
            throw new Error("Connect an upstream repository first");
          upstream = await this.remote.fetch(upstream.revision);
        }
        if (this.#closed) return;
        this.#set({ upstream, phase: idleSyncPhase(this.#state) });
        if (action === "fetch") this.#feedback.recovered();
        return;
      }
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
      if (
        action === "push" &&
        (this.#pending ||
          this.#state.recovery ||
          this.#state.proposal?.conflicts.length)
      )
        throw new Error("Review pending synchronization before pushing");
      await this.#applyPending();
      if (this.#cancelled(action)) return;
      let remote = await this.remote.status();
      this.#set({ upstream: remote });
      if (this.#cancelled(action)) return;
      if (!remote.configuration) {
        if (action !== "sync")
          throw new Error("Connect an upstream repository first");
        this.#set({ phase: "ready" });
        this.#feedback.recovered();
        return;
      }
      remote = await observePublication(this.remote, remote);
      if (this.#cancelled(action)) return;
      this.#set({ upstream: remote });
      if (!remote.configuration) return;
      this.#revision = remote.revision;
      if (action === "push") {
        if (!remote.configuration.canPush)
          throw new Error(
            "This account cannot push to the upstream repository",
          );
        const captured = await this.guard(async () => {
          if (this.#cancelled(action)) return false;
          await this.remote.keepCurrent();
          return true;
        });
        if (!captured || this.#cancelled(action)) return;
        this.#set({ phase: "publishing" });
        await publishSync(this.service, remote.revision);
        if (this.#closed) return;
        this.#set({ upstream: await refreshPublished(this.remote, remote) });
        this.#set({ phase: idleSyncPhase(this.#state) });
        this.#feedback.recovered();
        return;
      }
      this.#resumeAction = action;
      const proposal = await this.service.prepare(remote.revision);
      if (this.#cancelled(action)) return;
      this.#set({ proposal: proposal ?? undefined, conflict: undefined });
      if (proposal?.conflicts.length) {
        this.#set({ phase: "conflicts" });
        if (this.#conflictKey !== proposal.candidate?.commit) {
          this.#conflictKey = proposal.candidate?.commit;
          this.#feedback.report(
            new Error(
              "Backup has conflicts. Open Backup settings to review them.",
            ),
          );
        }
        return;
      }
      if (proposal?.candidate) {
        await applyCandidate({
          candidate: proposal.candidate.commit,
          revision: remote.revision,
          service: this.service,
          remote: this.remote,
          recovery: this.recovery,
          guard: this.guard,
          cancelled: () => this.#cancelled(action),
          closed: () => this.#closed,
          pending: (next) => {
            this.#pending = next;
            if (!next) this.#set({ recovery: false });
          },
          applying: () => this.#set({ phase: "applying", recovery: true }),
        });
      }
      if (this.#cancelled(action)) return;
      if (action === "sync" && remote.configuration.canPush) {
        this.#set({ phase: "publishing" });
        await publishSync(this.service, remote.revision);
        remote = await refreshPublished(this.remote, remote);
      }
      if (!this.#closed) {
        this.#set({
          upstream: action === "sync" ? remote : await this.remote.status(),
        });
        this.#set({
          phase: this.#state.enabled ? "ready" : "paused",
          proposal: undefined,
          ...(action === "sync" ? { lastSuccess: Date.now() } : {}),
        });
        this.#feedback.recovered();
      }
    } catch (error) {
      if (!this.#closed) {
        this.#set({
          phase: "attention",
          recovery: this.#state.recovery || !!this.#pending,
        });
        this.#feedback.report(error);
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
      if (!this.#closed) this.#feedback.report(error);
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
      this.#feedback.recovered();
    } catch (error) {
      if (!this.#closed) this.#feedback.report(error);
    } finally {
      this.#set({ busy: false });
    }
    if (!this.#state.proposal?.conflicts.length)
      await this.run(this.#resumeAction);
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
      this.#feedback.recovered();
    } catch (error) {
      if (!this.#closed) this.#feedback.report(error);
    } finally {
      this.#set({ busy: false });
    }
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
