// Adapted from jj-store/web/src/lib/controller/agent-runtimes.svelte.ts.
export interface AgentClient {
  id: string;
  label: string;
  state: string;
  detail: string;
  guide_url: string;
  adapter_version: string | null;
  cli_version: string | null;
  managed: boolean;
  action: "install" | "update" | null;
  target_version: string | null;
  target_cli_version: string | null;
}
export interface ClientOutcome {
  request_id: string;
  runtime_id: string;
  state: string;
  error: string | null;
}
export interface ClientStatus {
  runtimes: AgentClient[];
  install_supported: boolean;
  install_unavailable: string | null;
  node_version: string | null;
  npm_available: boolean;
  pending: ClientOutcome | null;
}
export interface ClientService {
  status(): Promise<ClientStatus>;
  install(request: string): Promise<ClientOutcome>;
  outcome(request: string): Promise<ClientOutcome>;
}
export class AgentClients {
  value = $state<ClientStatus | null>(null);
  refreshing = $state(false);
  saving = $state(false);
  error = $state("");
  commandError = $state("");
  pending = $state<string | null>(null);
  outcome = $state<ClientOutcome | null>(null);
  #alive = true;
  #active = false;
  #timer?: ReturnType<typeof setTimeout>;
  #progress?: { complete(): void; fail(error: unknown): void };
  constructor(
    readonly service: ClientService,
    readonly report: (error: unknown) => void,
    readonly begin: () => { complete(): void; fail(error: unknown): void },
  ) {}
  available = () => this.#alive;
  start() {
    this.#active = true;
    void this.refresh();
  }
  stop() {
    this.#active = false;
  }
  async refresh() {
    if (!this.#alive || this.refreshing) return;
    this.refreshing = true;
    try {
      if (this.pending)
        this.accept(await this.service.outcome(this.pending), this.pending);
      const value = await this.service.status();
      if (!this.#alive) return;
      this.value = value;
      this.pending ??= value.pending?.request_id ?? null;
      this.error = "";
    } catch (error) {
      if (this.#alive) {
        this.error = error instanceof Error ? error.message : String(error);
        this.report(error);
      }
    } finally {
      this.refreshing = false;
      if (this.#alive && (this.pending || this.#active)) {
        clearTimeout(this.#timer);
        this.#timer = setTimeout(
          () => void this.refresh(),
          this.pending ? 2000 : 30000,
        );
      }
    }
  }
  async install(runtime: AgentClient) {
    if (
      !this.#alive ||
      this.pending ||
      this.saving ||
      !this.value?.install_supported ||
      !runtime.action
    )
      return;
    const request = crypto.randomUUID().replaceAll("-", "");
    this.pending = request;
    this.saving = true;
    this.commandError = "";
    this.#progress = this.begin();
    try {
      this.accept(await this.service.install(request), request);
    } catch (error) {
      this.commandError =
        "Installation outcome is unconfirmed. Check the original request before installing again.";
      this.report(error);
    } finally {
      this.saving = false;
      await this.refresh();
    }
  }
  private accept(outcome: ClientOutcome, request: string) {
    if (!this.#alive) return;
    if (outcome.request_id !== request || outcome.runtime_id !== "codex")
      throw new Error(
        "AI installation receipt does not match the original request",
      );
    this.outcome = outcome;
    if (
      ["completed", "failed", "interrupted", "not_started"].includes(
        outcome.state,
      )
    ) {
      this.pending = null;
      this.commandError = outcome.error ?? "";
      if (outcome.error) {
        this.#progress?.fail(outcome.error);
        this.report(new Error(outcome.error));
      } else this.#progress?.complete();
      this.#progress = undefined;
    }
  }
  destroy() {
    this.#alive = false;
    clearTimeout(this.#timer);
    this.#progress?.complete();
  }
}
