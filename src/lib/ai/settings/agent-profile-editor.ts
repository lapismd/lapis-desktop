import type { App } from "@lapis-notes/api";
import type { AiPluginSettings } from "./ai-settings.ts";
import type { AcpAgentId } from "./acp-agents.ts";
import type { AiSettingsStore } from "./settings-store.ts";
import type { ModelRef } from "../core/models.ts";

/** Presentation ports shared by chat and Settings; none can start a provider. */
export type AgentProfileEditorContext = {
  mentionPeople?: readonly import("../conversations/recipients.ts").ComposerPersonOption[];
  app?: App;
  settings?: Partial<AiPluginSettings>;
  initializing?: boolean;
  models?: ModelRef[];
  loadModels?: (
    agent: AcpAgentId,
    runtime: AiPluginSettings["defaultRuntime"],
  ) => Promise<ModelRef[]>;
  onSettingsChange?: (patch: Partial<AiPluginSettings>) => void | Promise<void>;
};

export type AgentProfileManagement = {
  app: App;
  settings: Pick<AiSettingsStore, "get" | "subscribe">;
  update: (patch: Partial<AiPluginSettings>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  loadModels: NonNullable<AgentProfileEditorContext["loadModels"]>;
};
