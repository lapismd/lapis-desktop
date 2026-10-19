import {
  AgentClients,
  type ClientStatus,
  type ClientOutcome,
} from "../../ai/settings/clients.svelte.ts";
import { NativeCaptureSources } from "./capture-sources.ts";
import type { App } from "@lapis-notes/api";
import { invoke } from "@tauri-apps/api/core";
import { createAcpClient, type AcpTransport } from "@lapismd/ai";
import { createTauriAcpTransport } from "@lapismd/ai/tauri";
import { AcpAgentRuntime } from "../../ai/runtimes/acp/runtime.ts";
import type { AiServices, AiLeaveMode } from "../../ai/plugin/services.ts";
import type { NativeCall, VaultDescriptor } from "../vault-client.ts";
import { nativeError } from "../native-error.ts";
import { AdmittedAiTransport } from "./admitted-transport.ts";
import { NativeAiModels } from "./model-catalog.ts";
import { NativeUserAgentsStore } from "./user-commands.ts";
import { LIVE_RUNTIME_UNAVAILABLE_REASON } from "../../ai/bootstrap/runtime-unavailable.ts";
import { NativeCommandParser } from "./command-parser.ts";
import { BackgroundWork } from "../../desktop/background-work.ts";
import type { AppToolHost } from "../../ai/tools/app-tool-host.ts";
import { NativeAppTools } from "./app-tools/coordinator.ts";
import { createToolPort, type ToolListen } from "./app-tools/port.ts";

import { NativeImportSources } from "./import-sources.ts";

export type NativeAiPorts = {
  call?: NativeCall;
  createTransport?: () => AcpTransport;
  tools?: AppToolHost;
  listenTools?: ToolListen;
};
export function createNativeAi(
  app: App,
  vault: VaultDescriptor,
  ports: NativeAiPorts = {},
): AiServices {
  const call = ports.call ?? invoke;
  const allowed = () =>
    app.workspaceTrust.trusted && !app.safeMode.disableOptionalCorePlugins;
  async function native<T>(
    command: string,
    args: Parameters<NativeCall>[1],
  ): Promise<T> {
    try {
      return await call<T>(command, args);
    } catch (error) {
      throw nativeError(error);
    }
  }
  const scope = new AdmittedAiTransport({
    create: ports.createTransport ?? createTauriAcpTransport,
    allowed,
    activate: () =>
      native("desktop_ai_admit", { request: { sessionId: vault.sessionId } }),
    release: (reload) => native("desktop_ai_release", { request: { reload } }),
  });
  const models = new NativeAiModels(scope);
  const importSources = new NativeImportSources(vault.sessionId, call, allowed);
  const captureSources = new NativeCaptureSources(
    vault.sessionId,
    call,
    allowed,
  );
  const background = new BackgroundWork(app.notifications, "ai");
  const clients = new AgentClients(
    {
      status: () =>
        background.run("Checking installed AI clients", () =>
          clientCall<ClientStatus>({ type: "status" }),
        ),
      install: (request) =>
        clientCall<ClientOutcome>({ type: "install", request }),
      outcome: async (request) => {
        const outcome = await clientCall<ClientOutcome>({
          type: "outcome",
          request,
        });
        if (outcome.state === "completed") scope.invalidateAdmission();
        return outcome;
      },
    },
    (error) =>
      app.notifications.notify({
        id: "ai-clients",
        title: "AI clients",
        source: "ai",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      }),
    () => background.begin("Installing AI client"),
  );
  function clientCall<T>(action: Record<string, string>): Promise<T> {
    if (!allowed())
      return Promise.reject(
        new Error("AI client management requires a trusted workspace"),
      );
    return native("desktop_ai_clients", {
      request: { sessionId: vault.sessionId, action },
    });
  }
  const parser = new NativeCommandParser();
  const reported = new WeakSet<Error>();
  const bridge = ports.tools
    ? new NativeAppTools(
        ports.tools,
        createToolPort(
          vault.sessionId,
          native,
          async () => {
            await scope.targets();
          },
          background,
          (error) => {
            if (reported.has(error)) return;
            reported.add(error);
            app.notifications.notify({
              id: `ai-tools-${vault.sessionId}`,
              title: "AI tools",
              source: "ai",
              severity: "error",
              persist: false,
              message: error.message,
            });
          },
          ports.listenTools,
        ),
      )
    : undefined;
  const userAgents = new NativeUserAgentsStore(
    vault.sessionId,
    async (command, args) => {
      return native(command, args ?? {});
    },
    (error) =>
      app.notifications.notify({
        title: "AI",
        source: "ai",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      }),
  );
  const runtime = new AcpAgentRuntime({
    client: createAcpClient(scope),
    close: (id) => scope.close(id),
    tools: bridge,
  });
  let closing: Promise<void> | undefined;
  function close(mode: AiLeaveMode): Promise<void> {
    scope.fence();
    clients.destroy();
    return (closing ??= (async () => {
      await Promise.all([
        models.close(),
        userAgents.close(),
        bridge?.close(),
        importSources.close(),
        captureSources.close(),
      ]);
      parser.close();
      await scope.dispose(mode === "reload");
    })().catch((error) => {
      closing = undefined;
      throw error;
    }));
  }
  return {
    clients,
    runtime,
    appToolBridge: bridge,
    models: {
      listModels: (provider, runtime) =>
        background.run("Preparing AI and loading models", () =>
          models.listModels(provider, runtime),
        ),
    },
    userAgents,
    importSources,
    captureSources,
    parseCommand: parser.parse,
    workspace: vault.profileId,
    unavailableReason: () =>
      !allowed()
        ? "AI is disabled in this workspace"
        : scope.targetCount === 0
          ? LIVE_RUNTIME_UNAVAILABLE_REASON
          : null,
    close,
  };
}
