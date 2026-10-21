import { providerTarget } from "../../settings/provider-profile.ts";
// SPDX-License-Identifier: Apache-2.0
// Retains the pre-controller runtime seam with a public native-client backend.
import type { createAcpClient } from "@lapismd/ai";
import type {
  AgentRequest,
  AgentRuntime,
  AgentCapabilities,
} from "../../core/runtime.ts";
import { ACP_APPROVAL_CAPABILITIES } from "../../core/approvals.ts";
import { AcpAgentSession } from "./session.ts";
import { initialAcpContext } from "./initial-context.ts";
import type { AcpAppTools, ToolTurnPort } from "./tool-turn.ts";

export type AcpRuntimeBackend = {
  client: ReturnType<typeof createAcpClient>;
  close(sessionId: string): Promise<void>;
  tools?: AcpAppTools;
  /** Host-owned launch preparation; never read from persisted request metadata. */
  launchTarget?: (request: AgentRequest, provider: string) => Promise<string>;
};
export class AcpAgentRuntime implements AgentRuntime {
  readonly id = "acp";
  readonly #backend: AcpRuntimeBackend;
  constructor(backend: AcpRuntimeBackend) {
    this.#backend = backend;
  }
  capabilities(): AgentCapabilities {
    return {
      preparesContext: true,
      skillSnapshots: true,
      sessions: true,
      resume: false,
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: true,
      mcpTools: Boolean(this.#backend.tools),
      approvals: ACP_APPROVAL_CAPABILITIES,
    };
  }
  async supports(request: AgentRequest): Promise<boolean> {
    if (!supported(request)) return false;
    const targets = await this.#backend.client.targets();
    return targets.some((target) =>
      request.agent
        ? target.id ===
          providerTarget(request.agent, request.agentProfile?.providerProfileId)
        : true,
    );
  }
  async start(request: AgentRequest): Promise<AcpAgentSession> {
    if (!supported(request))
      throw new Error("ACP request unsupported by current native policy");
    const initialContext = initialAcpContext(request);
    const targets = await this.#backend.client.targets();
    const target = targets.find((target) =>
      request.agent
        ? target.id ===
          providerTarget(request.agent, request.agentProfile?.providerProfileId)
        : true,
    );
    if (!target) throw new Error("ACP target unavailable");
    const descriptor = request.appToolSession;
    const tools = this.#backend.tools;
    if (descriptor?.status === "available" && !tools)
      throw new Error("Application tools are unavailable");
    const targetId = this.#backend.launchTarget
      ? await this.#backend.launchTarget(request, target.id)
      : (tools?.target(descriptor, target.id) ?? target.id);
    const turnTools: ToolTurnPort | undefined =
      descriptor?.status === "available" && descriptor.bridgeId && tools
        ? {
            arm: (id) => tools.arm(descriptor.bridgeId!, id),
            end: (id) => tools.end(descriptor.bridgeId!, id),
          }
        : undefined;
    const session = new AcpAgentSession(
      120_000,
      turnTools,
      request.agent ?? target.id,
      request.agentProfile,
      initialContext,
    );
    const requestId = crypto.randomUUID();
    let bound = false;
    try {
      const native = await this.#backend.client.open(
        { requestId, targetId },
        {
          consume: (value) => session.consume(value),
          onFailure: (error) => session.fail(error),
        },
      );
      session.bind(native);
      bound = true;
      const configuration = await session.configure({
        executionMode: request.executionMode,
        ...(request.model ? { model: request.model } : {}),
        ...(request.thinking ? { thinking: request.thinking } : {}),
      });
      if (
        configuration.executionMode?.status === "unsupported" ||
        configuration.model?.status === "unsupported" ||
        configuration.thinking?.status === "unsupported"
      )
        throw new Error("requested_configuration_unavailable");
      return session;
    } catch (error) {
      // A lost open reply may already own a worker. Locate that request once;
      // never retry open or reinterpret an old controller/provider identity.
      try {
        await session.close();
        if (!bound) {
          const owned = (await this.#backend.client.list()).filter(
            (info) => info.requestId === requestId,
          );
          const cleanup = await Promise.allSettled(
            owned.map((info) => this.#backend.close(info.sessionId)),
          );
          const failures = cleanup.flatMap((result) =>
            result.status === "rejected" ? [result.reason] : [],
          );
          if (failures.length)
            throw new AggregateError(failures, "Native cleanup failed");
        }
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          "ACP startup cleanup failed",
        );
      }
      throw error;
    }
  }
  async resume(
    _bindingId: string,
    _request?: Omit<AgentRequest, "prompt">,
  ): Promise<AcpAgentSession> {
    throw new Error(
      "ACP resume unavailable; create an explicit new binding with handoff",
    );
  }
}
function supported(request: AgentRequest): boolean {
  return (
    !request.requirePolicyAmendments &&
    (!request.restricted ||
      (request.agent === "local" &&
        !request.agentProfile?.providerProfileId &&
        !request.appToolSession &&
        !request.skillSnapshot &&
        !request.skillActivations?.length)) &&
    !request.mcpServers?.length
  );
}
