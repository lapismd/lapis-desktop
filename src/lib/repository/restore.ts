export type RestorePreview = {
  checkpoint: string;
  path: string;
  expected: string;
  bytes: number;
  deleted: boolean;
};
export type RestoreRequest = {
  request_id: string;
  checkpoint: string;
  path: string;
  expected: string;
};
export interface RestoreService {
  preview(checkpoint: string, path: string): Promise<RestorePreview>;
  apply(request: RestoreRequest): Promise<unknown>;
  previewVault?(checkpoint: string): Promise<VaultRestorePreview>;
  applyVault?(request: VaultRestoreRequest): Promise<unknown>;
  keepCurrent?(): Promise<unknown>;
}
export type RestoreState = {
  open: boolean;
  busy: boolean;
  preview?: RestorePreview;
  request?: RestoreRequest;
  scope?: "file" | "vault";
  vault?: VaultRestorePreview;
  vaultRequest?: VaultRestoreRequest;
  recovery?: boolean;
};
export class RestoreController {
  #state: RestoreState = { open: false, busy: false };
  #listeners = new Set<(state: RestoreState) => void>();
  #epoch = 0;
  #closed = false;
  readonly service: RestoreService;
  readonly guard: <T>(
    path: string | undefined,
    action: () => Promise<T>,
  ) => Promise<T>;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  readonly persist: (pending?: PendingRestore) => Promise<void>;
  constructor(
    service: RestoreService,
    guard: RestoreController["guard"],
    feedback: RestoreController["feedback"],
    persist: RestoreController["persist"] = async () => {},
  ) {
    this.service = service;
    this.guard = guard;
    this.feedback = feedback;
    this.persist = persist;
  }
  subscribe(listener: (state: RestoreState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(patch: Partial<RestoreState>) {
    if (this.#closed) return;
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.#state);
  }
  async prepare(checkpoint: string, path: string) {
    if (this.#closed || this.#state.busy) return;
    const epoch = ++this.#epoch;
    this.#set({
      open: true,
      busy: true,
      preview: undefined,
      request: undefined,
      scope: "file",
      recovery: false,
      vault: undefined,
      vaultRequest: undefined,
    });
    try {
      const preview = await this.guard(path, () =>
        this.service.preview(checkpoint, path),
      );
      if (epoch !== this.#epoch || this.#closed) return;
      if (preview.checkpoint !== checkpoint || preview.path !== path)
        throw new Error("Restore preview does not match the selected version");
      this.#set({
        preview,
        request: {
          request_id: crypto.randomUUID(),
          checkpoint,
          path,
          expected: preview.expected,
        },
      });
      this.feedback.recovered();
    } catch (error) {
      if (epoch === this.#epoch && !this.#closed) {
        this.#set({ open: false });
        this.feedback.report(error);
      }
    } finally {
      if (epoch === this.#epoch) this.#set({ busy: false });
    }
  }
  async prepareVault(checkpoint: string) {
    if (
      this.#closed ||
      this.#state.busy ||
      !this.service.previewVault ||
      !this.service.applyVault
    )
      return;
    const epoch = ++this.#epoch;
    this.#set({
      open: true,
      busy: true,
      scope: "vault",
      recovery: false,
      preview: undefined,
      request: undefined,
      vault: undefined,
      vaultRequest: undefined,
    });
    try {
      const vault = await this.guard(undefined, () =>
        this.service.previewVault!(checkpoint),
      );
      if (epoch !== this.#epoch || this.#closed) return;
      if (vault.checkpoint !== checkpoint)
        throw new Error(
          "Vault restore preview does not match the selected checkpoint",
        );
      this.#set({
        vault,
        vaultRequest: {
          request_id: crypto.randomUUID(),
          checkpoint,
          expected: vault.expected,
        },
      });
      this.feedback.recovered();
    } catch (error) {
      if (epoch === this.#epoch && !this.#closed) {
        this.#set({ open: false });
        this.feedback.report(error);
      }
    } finally {
      if (epoch === this.#epoch) this.#set({ busy: false });
    }
  }
  async apply() {
    const request = this.#state.request;
    const vaultRequest = this.#state.vaultRequest;
    const action =
      vaultRequest && this.service.applyVault
        ? () => this.service.applyVault!(vaultRequest)
        : request
          ? () => this.service.apply(request)
          : undefined;
    if (!action || this.#closed || this.#state.busy) return;
    const epoch = this.#epoch;
    this.#set({ busy: true });
    try {
      await this.persist(
        vaultRequest
          ? { version: 1, scope: "vault", request: vaultRequest }
          : { version: 1, scope: "file", request: request! },
      );
      if (this.#closed || epoch !== this.#epoch) return;
      await this.guard(vaultRequest ? undefined : request!.path, action);
      await this.persist(undefined);
      if (epoch === this.#epoch && !this.#closed) {
        this.#set({ open: false });
        this.feedback.recovered();
      }
    } catch (error) {
      if (epoch === this.#epoch && !this.#closed) this.feedback.report(error);
    } finally {
      if (epoch === this.#epoch) this.#set({ busy: false });
    }
  }
  recover(pending: PendingRestore) {
    if (
      this.#closed ||
      this.#epoch !== 0 ||
      this.#state.open ||
      this.#state.busy
    )
      return;
    this.#set({
      open: true,
      busy: false,
      recovery: true,
      scope: pending.scope,
      preview: undefined,
      vault: undefined,
      request: pending.scope === "file" ? pending.request : undefined,
      vaultRequest: pending.scope === "vault" ? pending.request : undefined,
    });
  }
  async keepCurrent() {
    if (
      !this.#state.recovery ||
      this.#state.busy ||
      this.#closed ||
      !this.service.keepCurrent
    )
      return;
    const epoch = this.#epoch;
    this.#set({ busy: true });
    try {
      // A worker capture is also a barrier behind an unknown restore. Do not
      // dismiss recovery while an older native command can still change files.
      await this.guard(undefined, () => this.service.keepCurrent!());
      await this.persist(undefined);
      if (!this.#closed && epoch === this.#epoch) {
        this.#set({ open: false, recovery: false });
        this.feedback.recovered();
      }
    } catch (error) {
      if (!this.#closed && epoch === this.#epoch) this.feedback.report(error);
    } finally {
      if (epoch === this.#epoch) this.#set({ busy: false });
    }
  }
  dismiss() {
    if (!this.#state.busy) this.#set({ open: false });
  }
  close() {
    this.#closed = true;
    this.#epoch++;
    this.#listeners.clear();
  }
}
export type VaultRestoreRequest = Omit<RestoreRequest, "path">;
export type VaultRestorePreview = {
  checkpoint: string;
  expected: string;
  added: number;
  modified: number;
  deleted: number;
};
export type PendingRestore =
  | { version: 1; scope: "file"; request: RestoreRequest }
  | { version: 1; scope: "vault"; request: VaultRestoreRequest };
