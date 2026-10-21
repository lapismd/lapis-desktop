/** Optional compute owns no renderer credentials and never starts on mount. */
export type ComputeSettings = {
  revision: number;
  model: string | null;
  memoryGb: number | null;
  sharing: boolean;
  peers: Record<string, unknown>;
  targetPeer: string | null;
};
export type ComputeStatus = {
  hardware?: unknown;
  settings: ComputeSettings;
  requestId: string | null;
  outcome: string | null;
  runtime: {
    state: string;
    invitation: unknown | null;
    progress: unknown | null;
    importedModel?: string | null;
    ownerId?: string | null;
  };
};
export type ComputeAction =
  | { type: "configure"; settings: ComputeSettings }
  | { type: "prepare" | "download" | "start" }
  | { type: "stop"; ownerId: string | null }
  | { type: "import"; path: string };
type Command = {
  requestId: string;
  expectedRevision: number;
  action: ComputeAction;
};
export type ComputeRequest =
  | { type: "status" }
  | { type: "command"; command: Command };
export class AiCompute {
  value = $state<ComputeStatus>();
  draft = $state<ComputeSettings>({
    revision: 0,
    model: null,
    memoryGb: null,
    sharing: false,
    peers: {},
    targetPeer: null,
  });
  busy = $state(false);
  failed = $state(false);
  pending = $state(false);
  memoryDraft = $state<{ canonical: string; text: string; unit: string }>();
  #dirty = false;
  edit(patch: Partial<ComputeSettings>) {
    if (this.busy || this.pending) return;
    this.draft = { ...this.draft, ...patch };
    this.#dirty = true;
  }
  #command?: Command;
  #running?: Promise<boolean>;
  #closed = false;
  constructor(
    private readonly request: (
      request: ComputeRequest,
    ) => Promise<ComputeStatus>,
    private readonly work: <T>(
      title: string,
      action: () => Promise<T>,
    ) => Promise<T>,
    private readonly changed: () => void,
    private readonly report: (error: unknown) => void,
    private readonly chooseFile?: () => Promise<string | null>,
  ) {}
  get canPickFile() {
    return Boolean(this.chooseFile);
  }
  async pickFile(): Promise<string | null> {
    if (this.#closed || this.busy || this.pending || !this.chooseFile)
      return null;
    try {
      const path = await this.chooseFile();
      return this.#closed || this.busy || this.pending ? null : path;
    } catch (error) {
      if (!this.#closed) this.report(error);
      return null;
    }
  }
  async refresh(): Promise<boolean> {
    try {
      const value = await this.work("Loading compute settings", () =>
        this.request({ type: "status" }),
      );
      this.#accept(value);
      return true;
    } catch (error) {
      if (!this.#closed) {
        this.failed = true;
        this.report(error);
      }
      return false;
    }
  }
  command(action: ComputeAction): Promise<boolean> {
    if (this.#closed || !this.value || this.busy) return Promise.resolve(false);
    this.#command ??= {
      requestId: crypto.randomUUID(),
      expectedRevision: this.value.settings.revision,
      action: structuredClone(action),
    };
    const command = this.#command;
    this.pending = true;
    this.busy = true;
    this.failed = false;
    return (this.#running = this.work("Updating optional compute", async () => {
      let value = await this.request({ type: "command", command });
      const deadline = Date.now() + 3_660_000;
      while (
        value.requestId === command.requestId &&
        value.outcome === "pending" &&
        !this.#closed
      ) {
        this.#accept(value);
        if (Date.now() > deadline)
          throw new Error(
            "Compute outcome is unknown. Check again before retrying.",
          );
        await new Promise((resolve) => setTimeout(resolve, 500));
        value = await this.request({ type: "status" });
      }
      this.#accept(value);
      if (
        value.requestId !== command.requestId ||
        value.outcome !== "completed"
      )
        throw new Error(
          "Compute needs attention. Stop compute and check its configuration before starting a new request.",
        );
      this.changed();
      return true;
    })
      .catch((error) => {
        if (!this.#closed) {
          this.failed = true;
          this.report(error);
        }
        return false;
      })
      .finally(() => {
        this.busy = false;
        this.#running = undefined;
      }));
  }
  #accept(value: ComputeStatus) {
    if (this.#closed) return;
    this.value = value;
    this.failed = false;
    if (
      !this.#command ||
      (value.requestId === this.#command.requestId &&
        value.outcome === "completed")
    ) {
      if (!this.#dirty || this.#command?.action.type === "configure") {
        this.draft = structuredClone(value.settings);
        this.#dirty = false;
      }
      this.#command = undefined;
      this.pending = false;
    }
  }
  async stop(): Promise<void> {
    if (!this.value) return;
    const revision = this.value.settings.revision;
    const ownerId = this.value.runtime.ownerId ?? null;
    const value = await this.work("Stopping compute", () =>
      this.request({
        type: "command",
        command: {
          requestId: crypto.randomUUID(),
          expectedRevision: revision,
          action: { type: "stop", ownerId },
        },
      }),
    ).catch((error) => {
      if (!this.#closed) this.report(error);
      throw error;
    });
    this.#accept(value);
    if (value.runtime.state === "off") {
      this.#command = undefined;
      this.pending = false;
      if (!this.#closed) this.changed();
    }
  }
  async close(): Promise<void> {
    this.#closed = true;
    if (this.value && (this.busy || this.value.runtime.state !== "off"))
      await this.stop();
    this.#closed = true;
    await this.#running;
  }
}
