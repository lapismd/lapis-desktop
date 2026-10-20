// SPDX-License-Identifier: Apache-2.0
// Desktop-owned retained Lapis AiPlugin composition; see ../NOTICE.md.
import type { App } from "@lapis-notes/api";
import type { AgentRequest } from "../core/runtime.ts";
import type { AiSettingsStore } from "../settings/settings-store.ts";
import { applyAppToolEnablement } from "../settings/ai-settings.ts";
import { registeredAppToolRefs } from "../settings/app-tool-setting-rows.ts";
import { AiConversationHost } from "./conversation-host.ts";
import {
  ownedAiServices,
  selectAiRuntime,
  aiLeaveMode,
  type AiLeaveMode,
} from "./services.ts";
import { AppToolHost } from "../tools/app-tool-host.ts";
import { createMcpServerContributionRegistry } from "../tools/mcp-server-registry.ts";
import { SkillRegistry, SkillSnapshotStore } from "../skills/registry.ts";
import { BUNDLED_APP_SKILLS } from "../skills/bundled/research.ts";
import { SlashCommandCatalog } from "../commands/catalog.ts";
import { SlashCommandRouter } from "../commands/router.ts";
import { CommandDiscovery } from "../commands/discovery.ts";
import { collectAiCatalog } from "../catalog/inventory.ts";
import type { CatalogToolRow } from "../catalog/types.ts";
import { AiMemory } from "./memory.ts";
import { AiMaintenance } from "./maintenance.ts";
import { BackgroundWork } from "../../desktop/background-work.ts";
export class AiApplication extends AiConversationHost {
  readonly appToolHost: AppToolHost;
  readonly services;
  readonly mcpServers = createMcpServerContributionRegistry();
  readonly skills: SkillRegistry;
  readonly skillSnapshots = new SkillSnapshotStore();
  readonly slashCatalog: SlashCommandCatalog;
  readonly slashRouter: SlashCommandRouter;
  readonly memory;
  readonly handoffSummaries;
  readonly memoryOwner: AiMemory;
  readonly maintenance: AiMaintenance;
  readonly lifetime = new AbortController();
  readonly background: BackgroundWork;
  leaveMode: AiLeaveMode = "close";
  #closing?: Promise<void>;
  #commandRefresh = 0;
  constructor(app: App, settings: AiSettingsStore) {
    super(app, settings);
    this.background = new BackgroundWork(app.notifications, "ai");
    this.appToolHost = new AppToolHost(app.agentTools, () =>
      this.getSettings(),
    );
    try {
      this.services = ownedAiServices(app, this.appToolHost);
    } catch (error) {
      this.appToolHost.close();
      throw error;
    }
    this.skills = new SkillRegistry({
      vault: app.vault,
      appSkills: app.agentSkills,
      bundled: [...BUNDLED_APP_SKILLS],
      extensionRootFor: (id) => app.plugins.plugins.get(id)?.manifest.dir,
    });
    this.slashCatalog = new SlashCommandCatalog(app.agentSlashCommands);
    this.slashCatalog.setFileCommandLoader((scope) =>
      this.refreshFileCommands(scope),
    );
    this.slashRouter = new SlashCommandRouter(this.slashCatalog, this.skills);
    this.memoryOwner = new AiMemory(this);
    this.memory = this.memoryOwner.memory;
    this.handoffSummaries = this.memoryOwner.handoffSummaries;
    this.maintenance = new AiMaintenance(this);
  }
  get models() {
    return this.services.models;
  }
  get workspace() {
    return this.services.workspace;
  }
  get appToolBridge() {
    return this.services.appToolBridge;
  }
  get userAgents() {
    return this.services.userAgents;
  }
  fallbackRuntime() {
    return this.services.runtime;
  }
  liveRuntimeUnavailableReason() {
    return this.services.unavailableReason();
  }
  async selectRuntime(request: AgentRequest) {
    if (!this.active) throw new Error("AI is disabled");
    return selectAiRuntime(this.services, request);
  }
  skillContext = () => ({
    scopeDir: this.createConversationInput().scopeDir,
    availableToolNames: this.app.agentTools
      .list()
      .map((item) => item.tool.name),
    enabledPluginIds: [...this.app.plugins.enabledPlugins],
  });
  async refreshFileCommands(
    scopeDir = this.currentConversationScope(),
  ): Promise<void> {
    if (!this.active) return;
    const generation = ++this.#commandRefresh;
    const next = await this.background.run("Discovering AI commands", () =>
      new CommandDiscovery({
        vault: this.app.vault,
        userAgents: this.userAgents,
        parse: this.services.parseCommand,
      }).discover(scopeDir),
    );
    if (this.active && generation === this.#commandRefresh)
      this.slashCatalog.replaceFileCommands(next.commands, next.overlays);
  }
  loadAiCatalog() {
    if (!this.active) return Promise.resolve([]);
    return this.operations.track(
      this.background.run("Loading AI catalog", () =>
        collectAiCatalog({
          tools: this.app.agentTools.list(),
          commands: this.app.agentSlashCommands.list(),
          registeredSkills: this.app.agentSkills.list(),
          vault: this.app.vault,
          bundled: BUNDLED_APP_SKILLS,
          settings: this.getSettings(),
          pluginLabel: (id) =>
            this.app.plugins.plugins.get(id)?.manifest.name?.trim() || id,
          userAgents: this.userAgents,
          parseCommand: this.services.parseCommand,
          scopeDir: this.currentConversationScope(),
        }),
      ),
    );
  }
  setCatalogToolEnabled(tool: CatalogToolRow, enabled: boolean) {
    this.assertActive();
    return this.settings.update((current) =>
      applyAppToolEnablement(
        current,
        { name: tool.name, owner: tool.owner },
        enabled,
        registeredAppToolRefs(this.app.agentTools),
      ),
    );
  }
  openCatalogSkill(path: string) {
    this.assertActive();
    return this.app.workspace.openLinkText(path, "");
  }
  report(error: unknown): void {
    this.app.notifications.notify({
      title: "AI",
      message: error instanceof Error ? error.message : String(error),
      source: "ai",
      severity: "error",
    });
  }
  close(): Promise<void> {
    return (this.#closing ??= this.shutdown().catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
  private async shutdown(): Promise<void> {
    this.active = false;
    this.lifetime.abort();
    this.maintenance.stop();
    this.appToolHost.close();
    const results = await Promise.allSettled([
      this.operations.closeViews(),
      this.services.appToolBridge?.close(),
    ]);
    results.push(
      ...(await Promise.allSettled([
        this.maintenance.settle(),
        this.settings.settle(),
        this.operations.settle(),
      ])),
    );
    // Keep native authority while durable persistence needs recovery. A later
    // close retries the same backend's drain before releasing the runtime.
    try {
      await this.persistence.drain();
      await this.drafts.drain();
      await this.conversations.protection?.dispose();
      this.releaseTranscriptWriters();
    } catch (error) {
      const earlier = results.flatMap((result) =>
        result.status === "rejected" ? [result.reason] : [],
      );
      throw new AggregateError(
        [...earlier, error],
        "AI persistence cleanup failed",
      );
    }
    results.push(
      ...(await Promise.allSettled([
        this.services.close(aiLeaveMode(this.app, this.leaveMode)),
      ])),
    );
    const failures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (failures.length)
      throw new AggregateError(failures, "AI cleanup failed");
  }
}
