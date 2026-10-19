// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
} from "../../core/runtime.ts";
import type { ConversationRepository } from "../../conversations/conversation-repository.ts";
import { buildConversationContextHandoff } from "../../conversations/context-handoff.ts";
import {
  reduceAgentBindings,
  type EffectiveAgentBinding,
} from "../../conversations/binding-state.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type TranscriptEntry,
} from "../../conversations/types.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _tryResumeBinding(
  this: AiChatController,
  targetRuntime: AgentRuntime,
  compatibleBinding: EffectiveAgentBinding,
  snapshot: Awaited<ReturnType<ConversationRepository["read"]>>,
  request: Omit<AgentRequest, "prompt">,
  previousSession: AgentSession | null,
  previousBindingId: string | undefined,
  turnId?: number,
): Promise<{ resumed: boolean; failedId?: string }> {
  if (
    !compatibleBinding.context ||
    !compatibleBinding.nativeSessionId ||
    !targetRuntime.resume
  ) {
    return { resumed: false, failedId: compatibleBinding.id };
  }
  let resumed: AgentSession | undefined;
  try {
    const handoff = await buildConversationContextHandoff(snapshot.transcript, {
      conversationId: snapshot.metadata.id,
      targetBindingId: compatibleBinding.id,
      after: {
        entryId: compatibleBinding.context.throughEntryId,
        entryHash: compatibleBinding.context.throughEntryHash,
      },
      bindings: reduceAgentBindings(snapshot.agents),
      summaries: snapshot.agents.filter(
        (record) => record.type === "handoff.summary.created",
      ),
    });
    const appToolSession = await this._prepareAppToolSession(
      compatibleBinding.id,
      targetRuntime,
      snapshot.location,
      snapshot.metadata.launchContext?.notePath,
    );
    const skillSnapshot = await this._prepareSkillSnapshot(
      compatibleBinding.id,
      snapshot.location.scopeDir,
    );
    resumed = await targetRuntime.resume!(compatibleBinding.nativeSessionId, {
      ...request,
      appToolSession,
      skillSnapshot,
      metadata: {
        ...request.metadata,
        ...(await this._sessionBootstrapMetadata(
          snapshot.location.scopeDir,
          snapshot.metadata.launchContext?.notePath,
          snapshot.metadata.id,
          appToolSession?.tools ?? [],
          skillSnapshot?.skills ?? [],
        )),
      },
    });
    const configured = await this._configureBinding(
      resumed,
      compatibleBinding,
      request,
    );
    if (!configured) throw new Error("Session configuration is unsupported.");
    if (this._isAbandoned(turnId)) {
      await resumed.close().catch(() => undefined);
      await this._closeAppToolBinding(compatibleBinding.id);
      return { resumed: true };
    }
    if (previousBindingId && previousBindingId !== compatibleBinding.id) {
      await this._closeAppToolBinding(previousBindingId);
      if (this.session === previousSession) this.session = null;
      await this._detachSession(previousSession);
    }
    const switchRecord: TranscriptEntry | undefined =
      previousBindingId !== compatibleBinding.id
        ? {
            schemaVersion: CONVERSATION_SCHEMA_VERSION,
            id: `switch-${crypto.randomUUID()}`,
            type: "agent.switch",
            createdAt: new Date().toISOString(),
            agentBindingId: compatibleBinding.id,
            fromBindingId: previousBindingId,
            toBindingId: compatibleBinding.id,
            handoffId: handoff?.handoffId,
            handoffMode: handoff?.mode,
            handoffThroughEntryId: handoff?.throughEntryId,
            omittedEntryCount: handoff?.omittedEntryCount,
          }
        : undefined;
    this.runtime = targetRuntime;
    this.session = resumed;
    this._activeBinding = configured.binding;
    this._activeBindingId = configured.binding.id;
    this.bindings = this.bindings.map((binding) =>
      binding.id === configured.binding.id ? configured.binding : binding,
    );
    if (handoff) this._pendingHandoffs.set(resumed, handoff);
    this._sessionContexts.set(resumed, {
      location: { ...snapshot.location },
      ...(switchRecord
        ? {
            pendingSwitch: switchRecord,
            pendingActivationBindingId: configured.binding.id,
          }
        : {}),
      ...(configured.pendingConfiguration
        ? { pendingConfiguration: configured.pendingConfiguration }
        : {}),
      ...(handoff ? { handoff } : {}),
      pendingItems: [],
    });
    void this._consume(resumed, configured.binding.id);
    return { resumed: true };
  } catch {
    await resumed?.close().catch(() => undefined);
    await this._closeAppToolBinding(compatibleBinding.id);
    return { resumed: false, failedId: compatibleBinding.id };
  }
}
