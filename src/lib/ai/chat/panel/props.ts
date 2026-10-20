// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import type { Component } from "svelte";
import type { TranscriptFrameProps } from "./transcript.ts";
import type { ComposerSearchSource } from "@lapismd/design-core/ai/chat";
import type {
  AgentRequest,
  AgentRuntime,
  McpServerContribution,
} from "../../core/runtime.ts";
import type { ModelRef } from "../../core/models.ts";
import type { AgentSessionStore } from "../../sessions/session-store.ts";
import type {
  ConversationRepository,
  CreateConversationInput,
} from "../../conversations/conversation-repository.ts";
import type { ConversationLocation } from "../../conversations/types.ts";
import { type AcpAgentId } from "../../settings/acp-agents.ts";
import { type AiPluginSettings } from "../../settings/ai-settings.ts";
import type { AppToolBridgeCoordinator } from "../../tools/app-tool-bridge.ts";
import type {
  SkillRegistry,
  SkillSnapshotStore,
} from "../../skills/registry.ts";
import type { SkillDiscoveryContext } from "../../skills/types.ts";
import type { SlashCommandRouter } from "../../commands/router.ts";
import type { AppToolHost } from "../../tools/app-tool-host.ts";
import type { AutomaticMemoryRecall } from "../../memory/types.ts";
import type { HandoffSummaryCoordinator } from "../../conversations/handoff-summary.ts";
export type AiChatPanelProps = {
  mentionPeople?: readonly import("../../conversations/recipients.ts").ComposerPersonOption[];
  agentOptions?: readonly import("../../conversations/recipients.ts").AgentRecipientOption[];
  /** Optional frame for standalone embeddings; the ordinary plugin supplies the session shell. */
  transcriptFrame?: Component<TranscriptFrameProps>;
  initialTranscriptView?: "document" | "classic";
  app?: App;
  runtime: AgentRuntime;
  selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
  unavailableReason?: string | null;
  initializing?: boolean;
  recordedImport?: import("../../conversations/types.ts").ConversationSnapshot;
  onControllerDispose?: (operation: Promise<void>) => void;
  onOperation?: (operation: Promise<void>) => void;
  workspace?: string;
  mcpServers?: McpServerContribution[];
  appToolBridge?: AppToolBridgeCoordinator;
  skills?: SkillRegistry;
  skillSnapshots?: SkillSnapshotStore;
  slashRouter?: SlashCommandRouter;
  appToolHost?: AppToolHost;
  memoryRecall?: AutomaticMemoryRecall;
  handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
  skillContext?: () => SkillDiscoveryContext;
  sessionStore?: AgentSessionStore;
  sessionId?: string;
  repository?: ConversationRepository;
  drafts?: import("../../drafts/store.ts").ConversationDraftStore;
  initialLocation?: ConversationLocation | null;
  createConversation?: (explicitFolder?: string) => CreateConversationInput;
  subscribeConversationMoves?: (
    listener: (oldPath: string, newPath: string) => void,
  ) => () => void;
  onRevealHistory?: () => void | Promise<void>;
  onConversationLocationChange?: (
    location: ConversationLocation | null,
  ) => void;
  currentConversationScope?: () => string;
  listConversationFolders?: () => string[];
  workspaceLeaf?: WorkspaceLeaf;
  fileSearch?: ComposerSearchSource;
  models?: ModelRef[];
  modelCatalogError?: string | null;
  loadExecutionModes?: (
    agent: AcpAgentId,
    runtime: AiPluginSettings["defaultRuntime"],
  ) => Promise<import("../../core/agent-profile.ts").ExecutionMode[]>;
  loadModels?: (
    agent: AcpAgentId,
    runtime: AiPluginSettings["defaultRuntime"],
  ) => Promise<ModelRef[]>;
  settings?: Partial<AiPluginSettings>;
  onSettingsChange?: (patch: Partial<AiPluginSettings>) => void | Promise<void>;
};
