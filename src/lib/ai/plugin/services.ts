// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import type { AgentRequest, AgentRuntime } from "../core/runtime.ts";
import type { AiModelCatalog } from "../settings/model-options.ts";
import type { AppToolBridgeCoordinator } from "../tools/app-tool-bridge.ts";
import type { AppToolHost } from "../tools/app-tool-host.ts";
import type { UserAgentsCommandStore } from "../commands/user-agents.ts";
import type { CommandParser } from "../commands/parser-port.ts";
import { ACP_APPROVAL_CAPABILITIES } from "../core/approvals.ts";
import { LIVE_RUNTIME_UNAVAILABLE_REASON } from "../bootstrap/runtime-unavailable.ts";
export type AiLeaveMode = "close" | "reload";
export interface AiServices {
  compute?: import("../settings/compute.svelte.ts").AiCompute;
  clients?: import("../settings/clients.svelte.ts").AgentClients;
  providers?: import("../settings/providers.svelte.ts").AiProviders;
  captureSources?: import("../capture/source-port.ts").AiCaptureSources;
  importSources?: import("../imports/source-port.ts").AiImportSources;
  runtime: AgentRuntime;
  models: AiModelCatalog;
  workspace?: string;
  userAgents?: UserAgentsCommandStore;
  parseCommand?: CommandParser;
  appToolBridge?: AppToolBridgeCoordinator;
  unavailableReason(): string | null;
  close(mode: AiLeaveMode): Promise<void>;
}
export type AiFactory = (app: App, tools: AppToolHost) => AiServices;
const bindings = new WeakMap<App, AiFactory>();
const leaveModes = new WeakMap<App, AiLeaveMode>();
export function prepareAiLeave(app: App, mode: AiLeaveMode): void {
  leaveModes.set(app, mode);
}
export function aiLeaveMode(app: App, fallback: AiLeaveMode): AiLeaveMode {
  return leaveModes.get(app) ?? fallback;
}
export function bindAi(app: App, factory: AiFactory): () => void {
  if (bindings.has(app)) throw new Error("AI is already bound to this App");
  bindings.set(app, factory);
  return () => {
    if (bindings.get(app) === factory) bindings.delete(app);
  };
}
export function ownedAiServices(app: App, tools: AppToolHost): AiServices {
  return (
    bindings.get(app)?.(app, tools) ?? {
      runtime: unavailableRuntime,
      models: { listModels: async () => [] },
      unavailableReason: () => LIVE_RUNTIME_UNAVAILABLE_REASON,
      close: async () => {},
    }
  );
}
const unavailableRuntime: AgentRuntime = {
  id: "acp",
  capabilities: () => ({
    sessions: false,
    resume: false,
    cancel: false,
    steer: false,
    modelSelection: false,
    nativeTools: false,
    mcpTools: false,
    approvals: ACP_APPROVAL_CAPABILITIES,
  }),
  supports: async () => false,
  start: async () => {
    throw new Error(LIVE_RUNTIME_UNAVAILABLE_REASON);
  },
};
export async function selectAiRuntime(
  services: AiServices,
  request: AgentRequest,
): Promise<AgentRuntime> {
  const preference = request.metadata?.runtime;
  if (preference !== undefined && preference !== "auto" && preference !== "acp")
    throw new Error(`Saved runtime ${String(preference)} is unavailable.`);
  const reason = services.unavailableReason();
  if (reason) throw new Error(reason);
  if (!(await services.runtime.supports(request)))
    throw new Error("The admitted ACP agent does not support this request.");
  return services.runtime;
}
