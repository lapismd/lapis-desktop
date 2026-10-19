// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
import {
  createAppToolExecutionScope,
  type AppToolRegistry,
  type AppToolExecutionContext,
  type AppToolResult,
} from "@lapis-notes/api/agent-tools";
import type {
  AppToolDescriptor,
  AppToolSessionDescriptor,
} from "../core/runtime.ts";
import { AppToolExecutionError, unavailableError } from "./app-tool-errors.ts";
import type {
  AppToolCapture,
  AppToolPolicySettings,
  AppToolCall,
  ActiveAppToolSession,
  CreateAppToolSessionInput,
} from "./app-tool-contracts.ts";
import { AppToolApprovalBroker } from "./app-tool-approvals.ts";
import { AppToolValidation } from "./app-tool-validation.ts";
import { isEligible, toDescriptor, grantKey } from "./app-tool-snapshot.ts";
import { createInvocationSignal, raceWithAbort } from "./app-tool-abort.ts";
import { AppToolExecutions } from "./app-tool-executions.ts";
const DEFAULT_TIMEOUT_MS = 60_000;
export class AppToolHost {
  readonly approvals = new AppToolApprovalBroker();
  readonly #sessions = new Map<string, ActiveAppToolSession>();
  readonly #grants = new Set<string>();
  readonly #validation = new AppToolValidation();
  readonly #activeInvocations = new Map<string, Map<() => void, string>>();
  readonly #registryChangeRef;
  readonly #executions = new AppToolExecutions();

  constructor(
    private readonly registry: AppToolRegistry,
    private readonly settings: () => AppToolPolicySettings,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
    private readonly capture?: AppToolCapture,
  ) {
    this.#registryChangeRef = registry.on("changed", (change) => {
      if (change.reason !== "unregistered") return;
      this.expireOwner(change.ownerPluginId);
      this.#validation.delete(change.registrationId);
    });
  }

  createSession(input: CreateAppToolSessionInput): AppToolSessionDescriptor {
    if (this.#sessions.has(input.agentBindingId)) {
      throw new Error(
        `App tool binding already exists: ${input.agentBindingId}`,
      );
    }
    const scope = createAppToolExecutionScope(input.scopeDir);
    const settings = this.settings();
    const eligible =
      settings.appToolsEnabled && input.runtimeSupportsAppTools
        ? this.registry
            .list()
            .filter((registered) => isEligible(registered, settings))
            .map(toDescriptor)
        : [];
    const descriptor = Object.freeze({
      conversationId: input.conversationId,
      agentBindingId: input.agentBindingId,
      scopeDir: scope.directory,
      launchNotePath: input.launchNotePath,
      tools: Object.freeze(eligible) as unknown as AppToolDescriptor[],
    });
    this.#sessions.set(input.agentBindingId, { descriptor, scope });
    return descriptor;
  }

  getSession(agentBindingId: string): AppToolSessionDescriptor | undefined {
    return this.#sessions.get(agentBindingId)?.descriptor;
  }

  async invoke(
    agentBindingId: string,
    call: AppToolCall,
    signal?: AbortSignal,
  ): Promise<AppToolResult> {
    const session = this.#sessions.get(agentBindingId);
    if (!session) throw unavailableError(call.name);
    const snapshot = session.descriptor.tools.find(
      (descriptor) => descriptor.name === call.name,
    );
    if (!snapshot) throw unavailableError(call.name);
    const registered = this.registry.resolve(
      snapshot.name,
      snapshot.registrationId,
    );
    if (!registered) throw unavailableError(call.name);
    const checkPolicy = () => {
      const settings = this.settings();
      if (
        !settings.appToolsEnabled ||
        !isEligible(registered, settings) ||
        !this.registry.resolve(snapshot.name, snapshot.registrationId)
      )
        throw unavailableError(call.name);
    };
    checkPolicy();

    const invocation = createInvocationSignal(signal, this.timeoutMs);
    const activeForBinding =
      this.#activeInvocations.get(agentBindingId) ??
      new Map<() => void, string>();
    activeForBinding.set(invocation.cancel, registered.owner.pluginId);
    this.#activeInvocations.set(agentBindingId, activeForBinding);
    const context: AppToolExecutionContext = Object.freeze({
      conversationId: session.descriptor.conversationId,
      agentBindingId: session.descriptor.agentBindingId,
      runId: call.runId,
      toolCallId: call.toolCallId,
      scope: session.scope,
      launchNotePath: session.descriptor.launchNotePath,
      signal: invocation.signal,
    });

    let dispatched = false;
    try {
      invocation.signal.throwIfAborted();
      this.#validation.input(registered, call.input);
      let grantForSession = false;
      if (
        registered.tool.effect !== "read" &&
        !this.#grants.has(grantKey(session.descriptor, registered))
      ) {
        const details = registered.tool.describeApproval
          ? await raceWithAbort(
              registered.tool.describeApproval(call.input, context),
              invocation.signal,
            )
          : undefined;
        const decision = await this.approvals.request(
          agentBindingId,
          registered,
          call.input,
          details,
          invocation.signal,
          call.toolCallId,
        );
        if (decision === "deny-once") {
          throw new AppToolExecutionError(
            "approval_denied",
            `Permission denied for app tool: ${call.name}`,
          );
        }
        if (decision === "allow-session") {
          grantForSession = true;
        }
      }

      checkPolicy();
      if (grantForSession) {
        this.#grants.add(grantKey(session.descriptor, registered));
      }

      invocation.signal.throwIfAborted();
      let spanId: string | undefined;
      if (this.capture && registered.tool.effect !== "read") {
        try {
          const span = await this.capture.begin({
            caller: "app-tool-host",
            requestKey: call.toolCallId,
            workspaceId: session.descriptor.scopeDir,
            captureMode: "cooperative",
            intent: "tool",
            toolName: call.name,
          });
          spanId = span.spanId;
        } catch {
          throw new AppToolExecutionError(
            "capture_unavailable",
            `Checkpoint capture is unavailable for app tool: ${call.name}`,
          );
        }
      }

      try {
        invocation.signal.throwIfAborted();
        checkPolicy();
        dispatched = true;
        const result = await raceWithAbort(
          this.#executions.run(agentBindingId, call.toolCallId, () =>
            registered.tool.execute(call.input, context),
          ),
          invocation.signal,
        );
        this.#validation.result(registered, result);
        if (spanId && this.capture) {
          await this.capture.finish({
            caller: "app-tool-host",
            requestKey: `${call.toolCallId}:finish`,
            workspaceId: session.descriptor.scopeDir,
            spanId,
            outcome: "succeeded",
          });
        }
        return result;
      } catch (error) {
        if (spanId && this.capture) {
          try {
            await this.capture.finish({
              caller: "app-tool-host",
              requestKey: `${call.toolCallId}:failed`,
              workspaceId: session.descriptor.scopeDir,
              spanId,
              outcome: dispatched ? "unknown" : "failed",
            });
          } catch {
            // Preserve the original tool error.
          }
        }
        throw error;
      }
    } catch (error) {
      const failure = (
        code: ConstructorParameters<typeof AppToolExecutionError>[0],
        message: string,
      ) =>
        new AppToolExecutionError(
          code,
          message,
          dispatched ? "unknown" : undefined,
        );
      if (!this.registry.resolve(snapshot.name, snapshot.registrationId)) {
        const unavailable = unavailableError(call.name);
        throw failure(unavailable.code, unavailable.message);
      }
      if (error instanceof AppToolExecutionError) {
        if (error.code === "cancelled" && invocation.timedOut()) {
          throw failure("timed_out", `App tool timed out: ${call.name}`);
        }
        throw failure(error.code, error.message);
      }
      if (invocation.signal.aborted) {
        throw failure(
          invocation.timedOut() ? "timed_out" : "cancelled",
          invocation.timedOut()
            ? `App tool timed out: ${call.name}`
            : `App tool cancelled: ${call.name}`,
        );
      }
      throw failure(
        "execution_failed",
        `App tool execution failed: ${call.name}`,
      );
    } finally {
      activeForBinding.delete(invocation.cancel);
      if (activeForBinding.size === 0) {
        this.#activeInvocations.delete(agentBindingId);
      }
      invocation.dispose();
    }
  }

  closeBinding(agentBindingId: string): void {
    this.#sessions.delete(agentBindingId);
    for (const cancel of this.#activeInvocations.get(agentBindingId)?.keys() ??
      []) {
      cancel();
    }
    this.#activeInvocations.delete(agentBindingId);
    this.approvals.closeBinding(agentBindingId);
    for (const key of this.#grants) {
      if (key.includes(`\u0000${agentBindingId}\u0000`))
        this.#grants.delete(key);
    }
  }
  drainBinding(agentBindingId: string, timeoutMs?: number): Promise<void> {
    return this.#executions.drain(agentBindingId, timeoutMs);
  }
  settleInvocation(agentBindingId: string, toolCallId: string): Promise<void> {
    return this.#executions.settle(agentBindingId, toolCallId);
  }

  expireOwner(ownerPluginId: string): void {
    for (const active of this.#activeInvocations.values()) {
      for (const [cancel, owner] of active) {
        if (owner === ownerPluginId) cancel();
      }
    }
    for (const key of this.#grants) {
      if (key.includes(`\u0000${ownerPluginId}\u0000`))
        this.#grants.delete(key);
    }
  }

  close(): void {
    for (const bindingId of this.#sessions.keys()) this.closeBinding(bindingId);
    this.approvals.close();
    this.registry.offref(this.#registryChangeRef);
    this.#validation.clear();
  }
}
