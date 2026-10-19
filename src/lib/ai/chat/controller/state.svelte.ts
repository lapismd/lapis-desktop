// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  McpServerContribution,
} from "../../core/runtime.ts";
import type { AgentUsage } from "../../core/models.ts";
import type { AutomaticMemoryRecall } from "../../memory/types.ts";
import type { AgentSessionStore } from "../../sessions/session-store.ts";
import type { CreateConversationInput } from "../../conversations/conversation-repository.ts";
import type { ConversationRepository } from "../../conversations/conversation-repository.ts";
import { type ConversationContextHandoff } from "../../conversations/context-handoff.ts";
import { type EffectiveAgentBinding } from "../../conversations/binding-state.ts";
import type { HandoffSummaryCoordinator } from "../../conversations/handoff-summary.ts";
import {
  type AgentBindingCreatedRecord,
  type AgentBindingConfigUpdatedRecord,
  type ConversationApprovalGrant,
  type ConversationLocation,
  type ConversationMetadata,
  type TranscriptEntry,
} from "../../conversations/types.ts";
import { chatSessionId } from "../chat-session.ts";
import { type AiChatItem } from "../chat-items.ts";
import type { AppToolBridgeCoordinator } from "../../tools/app-tool-bridge.ts";
import type { AppToolHost } from "../../tools/app-tool-host.ts";
import {
  SkillSnapshotStore,
  type SkillRegistry,
} from "../../skills/registry.ts";
import type { SkillDiscoveryContext } from "../../skills/types.ts";
import { SlashCommandRouter } from "../../commands/router.ts";
import { OwnedAiWork } from "../../core/owned-work.ts";
import type { ConversationListEntry } from "../../conversations/transcript-store.ts";
import type { AcpAgentId } from "../../settings/acp-agents.ts";
export class AiChatControllerState {
  _disposed = false;
  readonly _backgroundWork = new OwnedAiWork();
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  commandWorking = $state(false);
  error = $state<string | null>(null);
  usage = $state<AgentUsage | null>(null);
  appToolsUnavailableReason = $state<string | null>(null);
  bindings = $state.raw<AgentBindingCreatedRecord[]>([]);
  location = $state.raw<ConversationLocation | null>(null);
  conversationStatus = $state<ConversationMetadata["status"] | null>(null);
  conversationPinned = $state(false);
  directoryContext = $state("");
  pickerEntries = $state.raw<ConversationListEntry[]>([]);
  session: AgentSession | null = null;
  runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  mcpServers: McpServerContribution[];
  readonly store?: AgentSessionStore;
  readonly repository?: ConversationRepository;
  readonly sessionId: string;
  readonly workspace?: string;
  request: Omit<AgentRequest, "prompt">;
  _sessionRequest: Omit<AgentRequest, "prompt">;
  _createdAt?: string;
  _persistQueue: Promise<void> = Promise.resolve();
  _terminalCheckpoint: Promise<void> = Promise.resolve();
  readonly _flushSessionTrace = new Map<AgentSession, () => void>();
  _activeBindingId?: string;
  _activeBinding?: EffectiveAgentBinding;
  _usageDirty = false;
  _recoveredTurn?: import("../../conversations/turn-intent.ts").ConversationTurnIntent;
  readonly _sessionContexts = new Map<
    AgentSession,
    {
      location: ConversationLocation | null;
      accepted?: boolean;
      turn?: {
        intent: import("../../conversations/turn-intent.ts").ConversationTurnIntent;
        known: boolean;
      };
      pendingBinding?: AgentBindingCreatedRecord;
      pendingSwitch?: TranscriptEntry;
      pendingActivationBindingId?: string;
      pendingConfiguration?: {
        previous: EffectiveAgentBinding;
        updated: EffectiveAgentBinding;
        agentRecord: AgentBindingConfigUpdatedRecord;
        transcriptEntry: Extract<TranscriptEntry, { type: "agent.config" }>;
      };
      handoff?: ConversationContextHandoff;
      pendingItems: AiChatItem[];
    }
  >();
  readonly _cancelledSessions = new WeakSet<AgentSession>();
  _turnId = 0;
  readonly _createConversation?: (
    explicitFolder?: string,
  ) => CreateConversationInput;
  readonly _onLocationChange?: (location: ConversationLocation | null) => void;
  readonly _selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
  readonly _appToolBridge?: AppToolBridgeCoordinator;
  _unsubscribeAppToolEvents?: () => void;
  readonly _skills?: SkillRegistry;
  readonly _skillSnapshots: SkillSnapshotStore;
  readonly _slashRouter?: SlashCommandRouter;
  readonly _appToolHost?: AppToolHost;
  readonly _skillContext?: () => SkillDiscoveryContext;
  readonly _readVaultText?: (path: string) => Promise<string | undefined>;
  readonly _memoryRecall?: AutomaticMemoryRecall;
  readonly _handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
  readonly _onComposerDefaults?: (next: {
    agent: AcpAgentId;
    runtimePreference: "acp" | "codex-native" | "opencode-native" | "fake";
  }) => void;
  _refreshSkills = false;
  _activeRecallAbort?: AbortController;
  readonly _runtimeContextReady = new WeakSet<AgentSession>();
  readonly _pendingHandoffs = new WeakMap<
    AgentSession,
    ConversationContextHandoff
  >();
  _approvalGrants: ConversationApprovalGrant[] = [];
  _followedScope?: string;
  _desiredFollowScope?: string;
  _followGeneration = 0;
  constructor(
    runtime: AgentRuntime,
    unavailableReason: string | null = null,
    mcpServers: McpServerContribution[] = [],
    options: {
      store?: AgentSessionStore;
      sessionId?: string;
      workspace?: string;
      request?: Omit<AgentRequest, "prompt">;
      repository?: ConversationRepository;
      location?: ConversationLocation | null;
      createConversation?: (explicitFolder?: string) => CreateConversationInput;
      onLocationChange?: (location: ConversationLocation | null) => void;
      selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
      appToolBridge?: AppToolBridgeCoordinator;
      skills?: SkillRegistry;
      skillSnapshots?: SkillSnapshotStore;
      slashRouter?: SlashCommandRouter;
      appToolHost?: AppToolHost;
      skillContext?: () => SkillDiscoveryContext;
      readVaultText?: (path: string) => Promise<string | undefined>;
      memoryRecall?: AutomaticMemoryRecall;
      handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
      onComposerDefaults?: (next: {
        agent: AcpAgentId;
        runtimePreference: "acp" | "codex-native" | "opencode-native" | "fake";
      }) => void;
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.mcpServers = mcpServers;
    this.store = options.store;
    this.repository = options.repository;
    this.location = options.location ?? null;
    if (this.location) {
      this.directoryContext = this.location.scopeDir;
      this._followedScope = this.location.scopeDir;
      this._desiredFollowScope = this.location.scopeDir;
    }
    this._createConversation = options.createConversation;
    this._onLocationChange = options.onLocationChange;
    this._selectRuntime = options.selectRuntime;
    this._appToolBridge = options.appToolBridge;
    this._skills = options.skills;
    this._skillSnapshots = options.skillSnapshots ?? new SkillSnapshotStore();
    this._slashRouter = options.slashRouter;
    this._appToolHost = options.appToolHost;
    this._skillContext = options.skillContext;
    this._readVaultText = options.readVaultText;
    this._memoryRecall = options.memoryRecall;
    this._handoffSummaries = options.handoffSummaries;
    this._onComposerDefaults = options.onComposerDefaults;
    this.workspace = options.workspace;
    this.request = options.request ?? {};
    this._sessionRequest = this.request;
    this.sessionId =
      options.sessionId ??
      chatSessionId(
        options.workspace,
        runtime.id,
        this.request.agent ?? "default",
      );
  }
}
