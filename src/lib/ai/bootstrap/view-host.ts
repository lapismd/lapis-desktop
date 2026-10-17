// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI orchestration; see ../NOTICE.md.
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import type {
  AgentRequest,
  AgentRuntime,
  McpServerContribution,
} from "../core/runtime.ts";
import type { ModelRef } from "../core/models.ts";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "../conversations/conversation-repository.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
import type { AppToolBridgeCoordinator } from "../tools/app-tool-bridge.ts";
export type AiViewHost = {
  selectRuntime(request: AgentRequest): Promise<AgentRuntime>;
  fallbackRuntime(): AgentRuntime;
  liveRuntimeUnavailableReason(): string | null;
  mcpServers: { list(): McpServerContribution[] };
  appToolBridge?: AppToolBridgeCoordinator;
  skills?: import("../skills/registry.ts").SkillRegistry;
  skillSnapshots?: import("../skills/registry.ts").SkillSnapshotStore;
  slashRouter?: import("../commands/router.ts").SlashCommandRouter;
  appToolHost?: import("../tools/app-tool-host.ts").AppToolHost;
  memory?: import("../memory/types.ts").AutomaticMemoryRecall;
  handoffSummaries?: Pick<
    import("../conversations/handoff-summary.ts").HandoffSummaryCoordinator,
    "afterTerminal"
  >;
  skillContext?: () => import("../skills/types.ts").SkillDiscoveryContext;
  conversations: ConversationRepository;
  createConversationInput(explicitFolder?: string): CreateConversationInput;
  currentConversationScope(): string;
  listConversationFolders(): string[];
  revealConversationHistory(): Promise<void>;
  subscribeConversationMoves?(
    listener: (oldPath: string, newPath: string) => void,
  ): () => void;
  searchVaultFiles: ComposerSearchSource;
  getSettings(): AiPluginSettings;
  updateSettings(patch: Partial<AiPluginSettings>): Promise<void>;
  subscribeSettings?(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void;
  models: {
    listModels(provider: string, runtime?: string): Promise<ModelRef[]>;
  };
  workspace?: string;
};
