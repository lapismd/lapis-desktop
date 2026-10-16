import type {
  App,
  AppSafeModeFailure,
  AppSafeModeState,
} from "@lapis-notes/api";
import type { WorkspaceStartupFailure } from "@lapismd/design-core/workspace/startup";
import {
  normalRecovery,
  startupDiagnostic,
  startupFailure,
} from "./startup-recovery.ts";

export class NotesRecovery {
  message = $state("");
  metadataBusy = $state(false);
  searchBusy = $state(false);
  #failure: AppSafeModeFailure | undefined;
  constructor(
    readonly app: App,
    readonly restart: (mode: AppSafeModeState) => Promise<void>,
  ) {}
  get reasons(): string[] {
    return [
      ...(this.app.safeMode.disableOptionalCorePlugins
        ? ["non-required core plugins disabled"]
        : []),
      ...(this.app.safeMode.skipLayoutRestore
        ? ["saved layout restore skipped"]
        : []),
    ];
  }
  failure(task: string, error: unknown): WorkspaceStartupFailure {
    this.#failure = startupFailure(task, error);
    return {
      title: "Lapis Notes could not start",
      description: "The workspace could not complete its startup sequence.",
      detail: this.#failure.detail,
      actions: [
        {
          id: "retry",
          label: "Retry",
          icon: "refresh-cw",
          onSelect: () => this.retry(),
        },
        {
          id: "copy-diagnostic",
          label: "Copy error details",
          icon: "copy",
          onSelect: () => this.copyDiagnostic(),
        },
        {
          id: "disable-optional-plugins",
          label: "Start with optional plugins disabled",
          icon: "shield-alert",
          onSelect: () => this.enter({ disableOptionalCorePlugins: true }),
        },
        {
          id: "skip-layout",
          label: "Start without restoring layout",
          icon: "layout-panel-top",
          onSelect: () => this.enter({ skipLayoutRestore: true }),
        },
        {
          id: "reset-layout",
          label: "Reset saved layout",
          icon: "panel-top-close",
          onSelect: () => this.resetLayout(),
        },
      ],
    };
  }
  private async run(action: () => Promise<void>): Promise<void> {
    this.message = "";
    try {
      await action();
    } catch (error) {
      this.message = error instanceof Error ? error.message : String(error);
    }
  }
  retry(): Promise<void> {
    return this.run(() => this.restart(this.app.safeMode));
  }
  normal(): Promise<void> {
    return this.run(() => this.restart(normalRecovery()));
  }
  enter(update: Partial<AppSafeModeState>): Promise<void> {
    return this.run(() =>
      this.restart({
        ...this.app.safeMode,
        ...update,
        active: true,
        lastStartupFailure: this.#failure ?? null,
      }),
    );
  }
  resetLayout(): Promise<void> {
    return this.run(async () => {
      await this.app.fileEditingSessions.guard(undefined, async () => {
        await this.app.workspace.resetLayoutToDefault();
        await this.app.workspace.flushLayout();
      });
      await this.restart(normalRecovery());
    });
  }
  copyDiagnostic(): Promise<void> {
    return this.run(async () => {
      if (!this.#failure) return;
      await navigator.clipboard.writeText(
        startupDiagnostic(this.app.vault.getName(), this.#failure),
      );
      this.message = "Startup diagnostic copied";
    });
  }
  async rebuild(kind: "metadata" | "search"): Promise<void> {
    if (this.metadataBusy || this.searchBusy) return;
    this.metadataBusy = kind === "metadata";
    this.searchBusy = kind === "search";
    try {
      await this.run(async () => {
        if (kind === "metadata") await this.app.metadataCache.rebuild();
        else await this.app.appDatabase.rebuildSearchIndex();
        this.message =
          kind === "metadata" ? "Metadata rebuilt" : "Search index rebuilt";
      });
    } finally {
      this.metadataBusy = false;
      this.searchBusy = false;
    }
  }
}
