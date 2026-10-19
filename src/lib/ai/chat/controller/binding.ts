// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  AppToolSessionDescriptor,
} from "../../core/runtime.ts";
import { type ConversationContextHandoff } from "../../conversations/context-handoff.ts";
import { type EffectiveAgentBinding } from "../../conversations/binding-state.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingCreatedRecord,
  type AgentBindingConfigUpdatedRecord,
  type ConversationLocation,
  type TranscriptEntry,
} from "../../conversations/types.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export function _activateNewBinding(
  this: AiChatController,
  bindingId: string,
  session: AgentSession,
  request: Omit<AgentRequest, "prompt">,
  runtime = this.runtime,
  handoff?: ConversationContextHandoff,
  replacesBindingId = this._activeBindingId,
): { binding: AgentBindingCreatedRecord; switchRecord?: TranscriptEntry } {
  const previousBindingId = this._activeBindingId;
  const binding: AgentBindingCreatedRecord = {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id: bindingId,
    type: "binding.created",
    createdAt: new Date().toISOString(),
    runtime: runtime.id,
    agent: request.agent,
    ...(request.recipients?.[0]
      ? { participant: { ...request.recipients[0] } }
      : {}),
    model: request.model ? { ...request.model } : undefined,
    thinking: request.thinking,
    nativeSessionId: session.id,
    handoffThroughEntryId: handoff?.throughEntryId,
    replacesBindingId,
  };
  const switchRecord: TranscriptEntry | undefined = previousBindingId
    ? {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `switch-${crypto.randomUUID()}`,
        type: "agent.switch",
        createdAt: binding.createdAt,
        agentBindingId: binding.id,
        fromBindingId: previousBindingId,
        toBindingId: binding.id,
        handoffId: handoff?.handoffId,
        handoffMode: handoff?.mode,
        handoffThroughEntryId: handoff?.throughEntryId,
        omittedEntryCount: handoff?.omittedEntryCount,
      }
    : undefined;
  this._activeBinding = binding;
  this._activeBindingId = binding.id;
  this.bindings = [...this.bindings, binding];
  return { binding, switchRecord };
}

export async function _prepareAppToolSession(
  this: AiChatController,
  bindingId: string,
  runtime: AgentRuntime,
  location: Pick<ConversationLocation, "conversationId" | "scopeDir">,
  launchNotePath?: string,
): Promise<AppToolSessionDescriptor | undefined> {
  if (!this._appToolBridge) return undefined;
  try {
    const descriptor = await this._appToolBridge.prepare({
      conversationId: location.conversationId,
      agentBindingId: bindingId,
      scopeDir: location.scopeDir,
      launchNotePath,
      runtimeSupportsAppTools:
        runtime.id !== "fake" && runtime.capabilities().mcpTools,
    });
    this.appToolsUnavailableReason =
      descriptor.status === "runtime-unavailable" && runtime.id === "fake"
        ? null
        : (descriptor.unavailableReason ?? null);
    return descriptor;
  } catch (error) {
    this.appToolsUnavailableReason = `Application tools are unavailable. ${
      error instanceof Error ? error.message : String(error)
    }`;
    return undefined;
  }
}

export async function _closeAppToolBinding(
  this: AiChatController,
  bindingId = this._activeBindingId,
): Promise<void> {
  if (!bindingId) return;
  await this._appToolBridge?.closeBinding(bindingId);
  if (!this._appToolBridge) {
    this._appToolHost?.closeBinding(bindingId);
  }
}

export async function _detachSession(
  this: AiChatController,
  session: AgentSession | null,
): Promise<void> {
  if (!session) return;
  if (session.detach) await session.detach().catch(() => undefined);
  else await session.close().catch(() => undefined);
}

export function _bindingMatchesIdentity(
  this: AiChatController,
  binding: AgentBindingCreatedRecord,
  request: Omit<AgentRequest, "prompt">,
  runtime = this.runtime,
): boolean {
  return (
    binding.runtime === runtime.id &&
    binding.agent === request.agent &&
    (binding.participant?.id ?? binding.agent) ===
      (request.recipients?.[0]?.id ?? request.agent)
  );
}

export function _bindingMatchesConfiguration(
  this: AiChatController,
  binding: AgentBindingCreatedRecord,
  request: Omit<AgentRequest, "prompt">,
): boolean {
  return (
    binding.model?.provider === request.model?.provider &&
    binding.model?.model === request.model?.model &&
    binding.thinking === request.thinking
  );
}

export async function _configureBinding(
  this: AiChatController,
  session: AgentSession,
  binding: EffectiveAgentBinding,
  request: Omit<AgentRequest, "prompt">,
): Promise<
  | {
      binding: EffectiveAgentBinding;
      pendingConfiguration?: {
        previous: EffectiveAgentBinding;
        updated: EffectiveAgentBinding;
        agentRecord: AgentBindingConfigUpdatedRecord;
        transcriptEntry: Extract<TranscriptEntry, { type: "agent.config" }>;
      };
    }
  | undefined
> {
  const modelChanged =
    binding.model?.provider !== request.model?.provider ||
    binding.model?.model !== request.model?.model;
  const thinkingChanged = binding.thinking !== request.thinking;
  if (!modelChanged && !thinkingChanged) return { binding };
  if (!session.configure) return undefined;
  try {
    const result = await session.configure({
      ...(modelChanged ? { model: request.model } : {}),
      ...(thinkingChanged ? { thinking: request.thinking } : {}),
    });
    if (
      (modelChanged &&
        result.model?.status !== "applied" &&
        result.model?.status !== "unchanged") ||
      (thinkingChanged &&
        result.thinking?.status !== "applied" &&
        result.thinking?.status !== "unchanged")
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  const updated: EffectiveAgentBinding = {
    ...binding,
    ...(modelChanged
      ? { model: request.model ? { ...request.model } : undefined }
      : {}),
    ...(thinkingChanged ? { thinking: request.thinking } : {}),
  };
  const createdAt = new Date().toISOString();
  return {
    binding: updated,
    pendingConfiguration: {
      previous: binding,
      updated,
      agentRecord: {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `config-${crypto.randomUUID()}`,
        type: "binding.config.updated",
        createdAt,
        agentBindingId: binding.id,
        ...(modelChanged && request.model
          ? { model: { ...request.model } }
          : {}),
        ...(thinkingChanged && request.thinking
          ? { thinking: request.thinking }
          : {}),
      },
      transcriptEntry: {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `agent-config-${crypto.randomUUID()}`,
        type: "agent.config",
        createdAt,
        agentBindingId: binding.id,
        ...(modelChanged && request.model
          ? { model: { ...request.model } }
          : {}),
        ...(thinkingChanged && request.thinking
          ? { thinking: request.thinking }
          : {}),
      },
    },
  };
}
