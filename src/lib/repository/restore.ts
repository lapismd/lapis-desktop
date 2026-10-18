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
}
export type RestoreState = {
  open: boolean;
  busy: boolean;
  preview?: RestorePreview;
  request?: RestoreRequest;
};
export class RestoreController {
  #state: RestoreState = { open: false, busy: false };
  #listeners = new Set<(state: RestoreState) => void>();
  #epoch = 0;
  #closed = false;
  readonly service: RestoreService;
  readonly guard: <T>(path: string, action: () => Promise<T>) => Promise<T>;
  readonly feedback: { report(error: unknown): void; recovered(): void };
  constructor(
    service: RestoreService,
    guard: RestoreController["guard"],
    feedback: RestoreController["feedback"],
  ) {
    this.service = service;
    this.guard = guard;
    this.feedback = feedback;
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
  async apply() {
    const request = this.#state.request;
    if (!request || this.#closed || this.#state.busy) return;
    const epoch = this.#epoch;
    this.#set({ busy: true });
    try {
      await this.guard(request.path, () => this.service.apply(request));
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
  dismiss() {
    if (!this.#state.busy) this.#set({ open: false });
  }
  close() {
    this.#closed = true;
    this.#epoch++;
    this.#listeners.clear();
  }
}
