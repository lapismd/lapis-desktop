// SPDX-License-Identifier: Apache-2.0
import type {
  AgentSessionConfiguration,
  AgentSessionConfigurationResult,
  AgentSessionConfigurationFieldResult,
} from "../../core/models.ts";
import type { AcpSessionClient } from "@lapismd/ai";
import {
  defaultExecutionMode,
  assertExecutionMode,
} from "../../core/agent-profile.ts";
import { record, text, AgentTurnFailure } from "./wire.ts";
export async function configureAcpSession(
  native: AcpSessionClient,
  input: AgentSessionConfiguration,
  provider = native.info.targetId,
): Promise<AgentSessionConfigurationResult> {
  assertExecutionMode(input.executionMode);
  const frame = await native.send(crypto.randomUUID(), {
    type: "configure",
    // Codex calls its user-reviewed approval mode "read-only". The shared
    // runtime resolves this exact advertised ID and must confirm modeReady.
    mode: input.executionMode ?? defaultExecutionMode(provider),
    ...(input.model ? { model: input.model.model } : {}),
    ...(input.thinking ? { effort: input.thinking } : {}),
  });
  if (frame.type === "error")
    throw new AgentTurnFailure(
      text(frame.code) ?? "configuration_rejected",
      "rejected",
    );
  if (frame.type !== "configured" || frame.modeReady !== true)
    throw new AgentTurnFailure("execution_mode_required", "rejected");
  const report = record(frame.configuration);
  const field = (value: unknown): AgentSessionConfigurationFieldResult => {
    const setting = record(value);
    const status = text(setting.status);
    return status === "applied" || status === "unchanged"
      ? { status }
      : {
          status: "unsupported",
          reason: status ?? "Configuration not confirmed",
        };
  };
  return {
    executionMode: field(report.mode),
    ...(input.model ? { model: field(report.model) } : {}),
    ...(input.thinking ? { thinking: field(report.effort) } : {}),
  };
}

/** Retain a confirmed mode through model-only changes; clearing is explicit. */
export class AcpSessionConfiguration {
  busy = false;
  #executionMode?: string;
  constructor(private readonly provider?: string) {}
  async apply(native: AcpSessionClient, input: AgentSessionConfiguration) {
    if (this.busy) throw new Error("ACP session busy");
    this.busy = true;
    try {
      const executionMode =
        "executionMode" in input ? input.executionMode : this.#executionMode;
      const result = await configureAcpSession(
        native,
        { ...input, executionMode },
        this.provider,
      );
      if (result.executionMode?.status !== "unsupported")
        this.#executionMode = executionMode;
      return result;
    } finally {
      this.busy = false;
    }
  }
}
