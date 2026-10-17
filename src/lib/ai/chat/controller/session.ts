// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat orchestration; see ../../NOTICE.md.
import type { AgentRequest, AgentSession } from "../../core/runtime.ts";
import type { ConversationRepository } from "../../conversations/conversation-repository.ts";
import { buildConversationContextHandoff } from "../../conversations/context-handoff.ts";
import {
  reduceAgentBindings,
  type EffectiveAgentBinding,
} from "../../conversations/binding-state.ts";
import { buildAvailableSkillsManifest } from "../../skills/manifest.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
export async function _prepareSession(
  this: AiChatController,
  request: Omit<AgentRequest, "prompt">,
  turnId?: number,
): Promise<void> {
  if (this._isAbandoned(turnId)) return;
  await this._terminalCheckpoint;
  if (this._isAbandoned(turnId)) return;
  const targetRuntime = this._selectRuntime
    ? await this._selectRuntime({
        ...request,
        prompt: "",
        mcpServers: request.mcpServers ?? this.mcpServers,
      })
    : this.runtime;
  if (this._isAbandoned(turnId)) return;

  const refreshRequiresReplacement =
    this._refreshSkills ||
    Boolean(request.skillActivations && request.skillActivations.length > 0);
  let activeConfigurationFailed = false;
  if (
    this.session &&
    this._activeBinding &&
    !refreshRequiresReplacement &&
    this._bindingMatchesIdentity(this._activeBinding, request, targetRuntime)
  ) {
    const configured = await this._configureBinding(
      this.session,
      this._activeBinding,
      request,
    );
    if (configured) {
      this.bindings = this.bindings.map((binding) =>
        binding.id === configured.binding.id ? configured.binding : binding,
      );
      this._activeBinding = configured.binding;
      if (configured.pendingConfiguration) {
        const context = this._sessionContexts.get(this.session) ?? {
          location: this.location ? { ...this.location } : null,
          pendingItems: [],
        };
        context.pendingConfiguration = configured.pendingConfiguration;
        this._sessionContexts.set(this.session, context);
      }
      await this._prepareSkillSnapshot(
        configured.binding.id,
        this.location?.scopeDir ?? this._discoveryContext().scopeDir,
      );
      this._sessionRequest = request;
      return;
    }
    activeConfigurationFailed = true;
  }

  const previousSession = this.session;
  const previousBindingId = this._activeBindingId;
  this._sessionRequest = request;
  let snapshot: Awaited<ReturnType<ConversationRepository["read"]>> | undefined;
  let compatibleBinding: EffectiveAgentBinding | undefined;
  let failedCompatibleBindingId: string | undefined;
  if (this.repository && this.location) {
    snapshot = await this.repository.read(this.location);
    compatibleBinding = [...reduceAgentBindings(snapshot.agents)]
      .reverse()
      .find(
        (binding) =>
          this._bindingMatchesIdentity(binding, request, targetRuntime) &&
          binding.id !==
            (activeConfigurationFailed ? previousBindingId : undefined) &&
          Boolean(binding.context) &&
          Boolean(binding.nativeSessionId),
      );
  }

  if (
    !refreshRequiresReplacement &&
    compatibleBinding?.nativeSessionId &&
    compatibleBinding.context &&
    snapshot &&
    targetRuntime.capabilities().resume &&
    targetRuntime.resume
  ) {
    const resumed = await this._tryResumeBinding(
      targetRuntime,
      compatibleBinding,
      snapshot,
      request,
      previousSession,
      previousBindingId,
      turnId,
    );
    if (resumed.resumed) return;
    failedCompatibleBindingId = resumed.failedId;
    compatibleBinding = undefined;
  }

  const bindingId = `binding-${crypto.randomUUID()}`;
  const handoff =
    snapshot && previousBindingId
      ? await buildConversationContextHandoff(snapshot.transcript, {
          conversationId: snapshot.metadata.id,
          targetBindingId: bindingId,
          bindings: reduceAgentBindings(snapshot.agents),
          summaries: snapshot.agents.filter(
            (record) => record.type === "handoff.summary.created",
          ),
        })
      : undefined;
  const skillSnapshot = await this._prepareSkillSnapshot(
    bindingId,
    snapshot?.location.scopeDir ?? this.location?.scopeDir ?? "",
  );
  const appToolLocation = snapshot?.location ?? this.location;
  const appToolSession = appToolLocation
    ? await this._prepareAppToolSession(
        bindingId,
        targetRuntime,
        appToolLocation,
        snapshot?.metadata.launchContext?.notePath,
      )
    : undefined;
  const preparedRequest: Omit<AgentRequest, "prompt"> = {
    ...request,
    skillSnapshot,
    metadata: {
      ...request.metadata,
      ...(skillSnapshot
        ? {
            availableSkillsManifest:
              buildAvailableSkillsManifest(skillSnapshot),
          }
        : {}),
      ...(appToolSession?.tools.length
        ? {
            availableAppTools: appToolSession.tools.map((tool) => tool.name),
          }
        : {}),
      ...(await this._sessionBootstrapMetadata(
        snapshot?.location.scopeDir ?? this.location?.scopeDir ?? "",
        snapshot?.metadata.launchContext?.notePath ??
          this._createConversation?.()?.launchNotePath,
        snapshot?.metadata.id ?? this.location?.conversationId,
        appToolSession?.tools ?? [],
        skillSnapshot?.skills ?? [],
      )),
    },
  };
  if (this._isAbandoned(turnId)) {
    await this._closeAppToolBinding(bindingId);
    return;
  }
  let started: AgentSession;
  try {
    started = await targetRuntime.start({
      ...preparedRequest,
      prompt: "",
      mcpServers: preparedRequest.mcpServers ?? this.mcpServers,
      appToolSession,
    });
  } catch (error) {
    await this._closeAppToolBinding(bindingId);
    throw error;
  }
  if (this._isAbandoned(turnId)) {
    this._cancelledSessions.add(started);
    void started.cancel?.().catch(() => undefined);
    await started.close().catch(() => undefined);
    await this._closeAppToolBinding(bindingId);
    return;
  }
  if (previousBindingId) {
    await this._closeAppToolBinding(previousBindingId);
    await this._detachSession(previousSession);
  }
  const { binding, switchRecord } = this._activateNewBinding(
    bindingId,
    started,
    request,
    targetRuntime,
    handoff,
    failedCompatibleBindingId ?? compatibleBinding?.id ?? previousBindingId,
  );
  if (handoff) this._pendingHandoffs.set(started, handoff);
  this._sessionContexts.set(started, {
    location: this.location ? { ...this.location } : null,
    ...(this.repository ? { pendingBinding: binding } : {}),
    ...(this.repository && switchRecord ? { pendingSwitch: switchRecord } : {}),
    ...(handoff ? { handoff } : {}),
    pendingItems: [],
  });
  this.runtime = targetRuntime;
  this.session = started;
  this._refreshSkills = false;
  void this._consume(started, this._activeBindingId);
}
