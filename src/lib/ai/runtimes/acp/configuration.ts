// SPDX-License-Identifier: Apache-2.0
import type {
  AgentSessionConfiguration,
  AgentSessionConfigurationResult,
  AgentSessionConfigurationFieldResult,
} from "../../core/models.ts";
import type { AcpSessionClient } from "@lapismd/ai";
import { record, text, AgentTurnFailure } from "./wire.ts";
export async function configureAcpSession(
  native: AcpSessionClient,
  input: AgentSessionConfiguration,
): Promise<AgentSessionConfigurationResult> {
  const frame = await native.send(crypto.randomUUID(), {
    type: "configure",
    mode: "ask",
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
    ...(input.model ? { model: field(report.model) } : {}),
    ...(input.thinking ? { thinking: field(report.effort) } : {}),
  };
}
