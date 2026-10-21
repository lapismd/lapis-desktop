import { setupFixture } from "./setup-fixture.ts";
import { reviewExecutionModes } from "./execution-modes.ts";
import { clientsFixture } from "./clients-fixture.ts";
import { agentReviewProfiles } from "./transcript/agent-profiles.ts";
// SPDX-License-Identifier: Apache-2.0
import {
  App,
  Plugin,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { registerAiSettings } from "../../../src/components/ai/settings/register-ai-settings.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { registeredAppToolRefs } from "../../../src/lib/ai/settings/app-tool-setting-rows.ts";
import { registerCatalogCleanup } from "../lifecycle.ts";

export type SettingsScenario =
  | "setup"
  | "setup-agents"
  | "setup-loading"
  | "setup-error"
  | "setup-save-error"
  | "setup-file-error"
  | "setup-running"
  | "setup-unknown-hardware"
  | "normal"
  | "legacy"
  | "catalog-error"
  | "clients"
  | "clients-ready"
  | "clients-loading"
  | "clients-error"
  | "profiles"
  | "profiles-empty"
  | "profiles-failure";

class SettingsFixturePlugin extends Plugin {
  clients?: ReturnType<typeof clientsFixture>;
  setup?: ReturnType<typeof setupFixture>;
  get providers() {
    return this.setup?.providers;
  }
  get agentProviders() {
    return this.setup?.agentProviders;
  }
  get compute() {
    return this.setup?.compute;
  }
  failNextSave = false;
  calls: string[] = [];
  settings = new AiSettingsStore(
    async (data) => {
      if (this.failNextSave) {
        this.failNextSave = false;
        throw new Error("Fixture settings write failed");
      }
      await this.saveData(data);
    },
    () => registeredAppToolRefs(this.app.agentTools),
  );
  models = {
    listExecutionModes: async () => reviewExecutionModes,
    listModels: async (
      provider: string,
      runtime?: string,
      profileId?: string,
    ) => {
      this.calls.push(
        `${provider}:${runtime}${profileId ? `:${profileId}` : ""}`,
      );
      if (provider === "local")
        return [
          {
            provider,
            model: profileId === "qwen" ? "qwen3.8-max" : "example-model",
            displayName:
              profileId === "qwen" ? "Qwen 3.8 Max" : "Example model",
          },
        ];
      if (this.scenario === "catalog-error")
        throw new Error("Fixture provider unavailable");
      return [
        {
          provider,
          model: `${provider}-saved`,
          displayName: `${provider} saved`,
        },
        {
          provider,
          model: `${provider}-next`,
          displayName: `${provider} next`,
        },
      ];
    },
  };
  constructor(
    app: App,
    private readonly scenario: SettingsScenario,
  ) {
    super(app, {
      id: "ai",
      name: "AI",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Lapis Notes catalog",
      description: "Disposable production AI Settings integration.",
    });
    if (scenario.startsWith("setup")) this.setup = setupFixture(app, scenario);
    if (scenario.startsWith("clients") || scenario.startsWith("profiles"))
      this.clients = clientsFixture(
        (error) => this.report(error),
        scenario.startsWith("profiles") ? "clients-ready" : scenario,
      );
    this.configureRuntime({
      source: "core",
      provenance: "bundled",
      required: false,
    });
  }
  report(error: unknown): void {
    this.app.notifications.notify({
      id: "ai-settings",
      title: "AI",
      severity: "error",
      source: "ai",
      message: String(error),
    });
  }
  async onload(): Promise<void> {
    this.settings.hydrate(await this.loadData());

    this.registerTool("read", "official");
    this.registerTool("community_count", "community");
    registerAiSettings(this);
  }
  registerTool(name: string, source: "official" | "community") {
    const registration = this.app.agentTools.register(
      {
        pluginId: source === "community" ? "counter" : "notes",
        source,
        provenance: source === "community" ? "community" : "official",
      },
      {
        name,
        description: name,
        effect: "read",
        inputSchema: { type: "object" },
        execute: async () => ({ content: [] }),
      },
    );
    this.register(() => registration.dispose());
    return registration;
  }
  async onunload(): Promise<void> {
    this.clients?.destroy();
    await this.setup?.close();
    await this.settings.settle();
  }
}

/** A disposable real App plus the production Settings integration; no AI execution. */
export function createSettingsFixture(scenario: SettingsScenario) {
  const database = new MemoryAppDatabase(crypto.randomUUID());
  const app = new App({
    version: "0.1.0-catalog",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter(),
    appDatabase: database,
    markdownRenderer: async () => {},
  });
  const plugin = new SettingsFixturePlugin(app, scenario);
  const controller = getWorkspaceHostBinding(app.workspace).controller;
  const ready = (async () => {
    await app.vault.load();
    await app.configuration.load();
    await plugin.saveData({
      settings: {
        ...(scenario === "profiles" || scenario === "profiles-failure"
          ? { agentParticipants: agentReviewProfiles }
          : {}),
        ...(scenario === "setup-agents" || scenario === "setup-save-error"
          ? {
              agentParticipants: [
                {
                  id: "qwen",
                  label: "Qwen research",
                  agent: "local",
                  providerProfileId: "qwen",
                  model: "qwen3.8-max",
                },
                {
                  id: "local-model",
                  label: "Offline assistant",
                  agent: "local",
                  providerProfileId: "local-model",
                },
              ],
            }
          : {}),
        defaultRuntime: scenario === "legacy" ? "codex-native" : "acp",
        memoryConsolidationRuntime: "acp",
        handoffSummaryRuntime: scenario === "legacy" ? "codex-native" : "acp",
        defaultModels: {
          codex: "codex-saved",
          cursor: "cursor-saved",
          opencode: "opencode-saved",
        },
      },
      sessions: [{ id: "retained-controller-history" }],
      futureValue: { retained: true },
    });
    await plugin.enable();
    await plugin.settings.settle();
    await controller.settings.load();
    controller.settings.selectSection(
      scenario.startsWith("clients") ||
        scenario.startsWith("profiles") ||
        scenario === "setup-agents" ||
        scenario === "setup-save-error"
        ? "ai-agents"
        : scenario.startsWith("setup")
          ? "ai-compute"
          : "ai",
    );
    if (scenario === "profiles-failure") plugin.failNextSave = true;
  })();
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      try {
        await ready;
      } finally {
        await app.fileEditingSessions.settleOperations();
        await plugin.disable();
        await app.workspace.disposeWorkspaceHost();
        await app.fileEditingSessions.dispose();
        await app.metadataCache.dispose();
        await database.close();
      }
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app,
    plugin,
    controller,
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
