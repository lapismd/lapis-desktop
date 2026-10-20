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
import { nativeSetupFixture } from "./native/setup-fixture.ts";
import type { NativeSetupScenario } from "./native/setup-port.ts";
import type { NativeConversationSettingsManagement } from "../../../src/lib/ai/settings/native-conversation-settings.ts";

export type SettingsScenario =
  | NativeSetupScenario
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
  nativeConversationSettings?: NativeConversationSettingsManagement;
  native?: ReturnType<typeof nativeSetupFixture>;
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
    listModels: async (provider: string, runtime?: string) => {
      this.calls.push(`${provider}:${runtime}`);
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
    if (this.scenario.startsWith("native")) {
      this.native = nativeSetupFixture(
        this.app,
        this.settings,
        this.scenario as NativeSetupScenario,
      );
      this.nativeConversationSettings = this.native.management;
      this.native.registerViews(this);
    }
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
    await this.native?.close();
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
        defaultRuntime: scenario === "legacy" ? "codex-native" : "acp",
        memoryConsolidationRuntime:
          scenario === "legacy" ? "codex-native" : "acp",
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
      scenario.startsWith("clients") || scenario.startsWith("profiles")
        ? "ai-agents"
        : scenario.startsWith("native")
          ? "ai-native-history"
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
