// SPDX-License-Identifier: Apache-2.0
import { Plugin, createVaultFileAppTools, type App } from "@lapis-notes/api";
import { AiSettingsStore } from "../../../lib/ai/settings/settings-store.ts";
import { registeredAppToolRefs } from "../../../lib/ai/settings/app-tool-setting-rows.ts";
import { AiApplication } from "../../../lib/ai/plugin/application.ts";
import { createSkillAppTools } from "../../../lib/ai/skills/skill-tools.ts";
import { createMemoryAppTools } from "../../../lib/ai/memory/memory-tools.ts";
import { seedBundledSkills } from "../../../lib/ai/skills/seed.ts";
import { seedReservedCommands } from "../../../lib/ai/commands/seed.ts";
import AiInventoryResult from "../chat/AiInventoryResult.svelte";
import { registerAiSettings } from "../settings/register-ai-settings.ts";
import { registerAiViews } from "./register-views.ts";
import { registerAiCommands } from "./register-commands.ts";
export class AiPlugin extends Plugin {
  readonly settings = new AiSettingsStore(
    (data) => this.saveData(data),
    () => registeredAppToolRefs(this.app.agentTools),
  );
  #application?: AiApplication;
  constructor(app: App) {
    super(app, {
      id: "ai",
      name: "AI",
      version: "0.1.0",
      minAppVersion: "0.0.1",
      author: "Lapis Notes",
      description:
        "Conversations, application context and skills through admitted native ACP agents.",
    });
  }
  get application(): AiApplication {
    if (!this.#application) throw new Error("AI is disabled");
    return this.#application;
  }
  get clients() {
    return this.application.services.clients;
  }
  get models() {
    return this.application.models;
  }
  getSettings() {
    return this.settings.get();
  }
  report(error: unknown): void {
    this.application.report(error);
  }
  async onload(): Promise<void> {
    let data = await this.loadData();
    const formerPath = ".lapis/plugins/ai/data.json";
    if (data == null && (await this.app.vault.adapter.exists(formerPath))) {
      data = JSON.parse(await this.app.vault.adapter.read(formerPath));
      await this.saveData(data);
    }
    this.settings.hydrate(data);
    const host = (this.#application = new AiApplication(
      this.app,
      this.settings,
    ));
    try {
      // Register existing file writers before restore/sync controls become usable.
      await host.conversations.listAll();
      registerAiSettings(this);
      for (const tool of createVaultFileAppTools(this.app.vault))
        this.registerAgentTool(tool);
      for (const tool of createSkillAppTools({
        registry: host.skills,
        snapshots: host.skillSnapshots,
        vault: this.app.vault,
      }))
        this.registerAgentTool(tool);
      for (const tool of createMemoryAppTools(host.memory))
        this.registerAgentTool(tool);
      for (const command of ["skills", "tools"])
        this.registerAgentResultView({ command, component: AiInventoryResult });
      registerAiViews(this, host);
      registerAiCommands(this, host);
      // Discovery is optional background work, not a gate on workspace input.
      void host.operations
        .track(
          host.background
            .run("Preparing AI commands", async () => {
              await seedBundledSkills(this.app.vault);
              if (host.userAgents) await seedReservedCommands(host.userAgents);
              await host.refreshFileCommands();
            })
            .finally(() => {
              if (host.active) host.maintenance.start();
            }),
        )
        .catch((error) => host.report(error));
      await this.settings.settle();
    } catch (error) {
      await host.close();
      throw error;
    }
  }
  async onunload(): Promise<void> {
    await this.#application?.close();
  }
}
