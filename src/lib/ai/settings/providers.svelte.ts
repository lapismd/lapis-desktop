/** Device provider settings: secret input is transient and never serialized by UI. */
export type ProviderConfiguration = {
  provider: string;
  endpoint: string | null;
  model: string | null;
};
export type ProviderStatus = {
  revision: number;
  configuration: ProviderConfiguration;
  credentialAvailable: boolean;
  keychainSupported: boolean;
  lastRequest: string | null;
  cleanupPending: boolean;
  providers: Array<{
    id: string;
    label: string;
    default_endpoint: string | null;
    endpoint_required: boolean;
    credential_env: string | null;
  }>;
};
type Save = {
  requestId: string;
  expectedRevision: number;
  configuration: ProviderConfiguration;
  secret: string | null;
  clearSecret: boolean;
};
export type ProviderAction =
  | { type: "status" }
  | { type: "save"; command: Save };
export class AiProviders {
  value = $state<ProviderStatus>();
  draft = $state<ProviderConfiguration>({
    provider: "",
    endpoint: null,
    model: null,
  });
  secret = $state("");
  dirty = $state(false);
  busy = $state(false);
  failed = $state(false);
  pending = $state(false);
  #command?: Save;
  #running?: Promise<boolean>;
  #closed = false;
  #confirmedRequest?: string;
  get superseded(): boolean {
    const pending = this.pending;
    return Boolean(
      pending &&
        this.#command &&
        this.value &&
        this.value.revision > this.#command.expectedRevision &&
        this.value.lastRequest !== this.#command.requestId,
    );
  }
  get readyToSave(): boolean {
    if (this.pending) return true;
    const provider = this.value?.providers.find(
      (p) => p.id === this.draft.provider,
    );
    return Boolean(
      provider &&
        (!provider.endpoint_required || this.draft.endpoint?.trim()) &&
        (["local", "paired"].includes(provider.id) ||
          this.draft.model?.trim()) &&
        (!provider.credential_env ||
          this.secret.trim() ||
          (this.value?.credentialAvailable &&
            this.value.configuration.provider === provider.id)),
    );
  }
  discardDraft(): void {
    if (this.pending || this.busy) return;
    this.secret = "";
    this.dirty = false;
    if (this.value)
      this.draft = structuredClone($state.snapshot(this.value.configuration));
  }
  useSaved(): void {
    if (this.busy || !this.superseded || !this.value) return;
    this.#command = undefined;
    this.pending = false;
    this.secret = "";
    this.dirty = false;
    this.draft = structuredClone($state.snapshot(this.value.configuration));
  }
  constructor(
    private readonly request: (
      action: ProviderAction,
    ) => Promise<ProviderStatus>,
    private readonly changed: () => void,
    private readonly report: (error: unknown) => void,
  ) {}
  configure(patch: Partial<ProviderConfiguration>) {
    if (this.busy || this.pending) return;
    this.draft = { ...this.draft, ...patch };
    this.dirty = true;
  }
  refresh(): Promise<boolean> {
    return this.#run(async () => {
      const value = await this.request({ type: "status" });
      this.#accept(value);
      return true;
    });
  }
  save(clearSecret = false): Promise<boolean> {
    if (!this.value || this.busy || this.#closed) return Promise.resolve(false);
    this.#command ??= {
      requestId: crypto.randomUUID(),
      expectedRevision: this.value.revision,
      configuration: structuredClone($state.snapshot(this.draft)),
      secret: clearSecret ? null : this.secret || null,
      clearSecret,
    };
    this.pending = true;
    return this.#run(async () => {
      const command = this.#command!;
      const value = await this.request({ type: "save", command });
      if (value.lastRequest !== command.requestId)
        throw new Error("AI settings outcome is unconfirmed. Check again.");
      this.#accept(value);
      return !value.cleanupPending;
    });
  }
  #accept(value: ProviderStatus) {
    if (this.#closed) return;
    const confirmed =
      this.#command && value.lastRequest === this.#command.requestId;
    if (confirmed) {
      if (this.#confirmedRequest !== this.#command!.requestId) {
        this.#confirmedRequest = this.#command!.requestId;
        this.changed();
      }
      if (!value.cleanupPending) {
        this.#command = undefined;
        this.pending = false;
        this.secret = "";
        this.dirty = false;
      }
    }
    if (!this.value || (!this.dirty && !this.pending))
      this.draft = structuredClone(value.configuration);
    this.value = value;
  }
  #run(action: () => Promise<boolean>): Promise<boolean> {
    if (this.#closed) return Promise.resolve(false);
    if (this.#running) return this.#running;
    this.busy = true;
    this.failed = false;
    return (this.#running = action()
      .catch((error) => {
        if (!this.#closed) {
          this.failed = true;
          this.report(error);
        }
        return false;
      })
      .finally(() => {
        this.#running = undefined;
        this.busy = false;
      }));
  }
  async close(): Promise<void> {
    this.#closed = true;
    await this.#running;
    this.secret = "";
    this.#command = undefined;
  }
}
