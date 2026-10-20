/** In-memory native ports for the production Settings screen, never provider IO. */
import type { App } from "@lapis-notes/api";
import {
  AiProviders,
  type ProviderStatus,
} from "../../../src/lib/ai/settings/providers.svelte.ts";
import {
  AiCompute,
  type ComputeStatus,
} from "../../../src/lib/ai/settings/compute.svelte.ts";
import { BackgroundWork } from "../../../src/lib/desktop/background-work.ts";
export function setupFixture(app: App, scenario: string) {
  let release!: () => void;
  const loading = new Promise<void>((resolve) => {
    release = resolve;
  });
  let provider: ProviderStatus = {
    revision: 1,
    configuration: {
      provider: "openai-api",
      endpoint: null,
      model: "example-model",
    },
    credentialAvailable: true,
    keychainSupported: true,
    lastRequest: null,
    cleanupPending: false,
    providers: [
      {
        id: "openai-api",
        label: "OpenAI",
        default_endpoint: "https://api.openai.com/v1",
        endpoint_required: false,
        credential_env: "OPENAI_COMPAT_API_KEY",
      },
      {
        id: "local",
        label: "This machine",
        default_endpoint: null,
        endpoint_required: false,
        credential_env: null,
      },
      {
        id: "paired",
        label: "Paired machine",
        default_endpoint: null,
        endpoint_required: false,
        credential_env: null,
      },
    ],
  };
  let computeValue: ComputeStatus = {
    settings: {
      revision: 0,
      model: "unsloth/Qwen3-0.6B-GGUF:Q4_K_M",
      memoryGb: null,
      sharing: false,
      peers: {},
      targetPeer: null,
    },
    requestId: null,
    outcome: null,
    runtime: {
      state: scenario === "setup-running" ? "serving" : "off",
      ownerId: scenario === "setup-running" ? crypto.randomUUID() : null,
      invitation: null,
      progress: null,
    },
  };
  const background = new BackgroundWork(app.notifications, "ai");
  function report(error: unknown) {
    app.notifications.notify({
      id: "ai-setup-fixture",
      source: "ai",
      title: "AI setup",
      severity: "error",
      message: String(error),
    });
  }
  async function ready() {
    if (scenario === "setup-loading") await loading;
    if (scenario === "setup-error") throw Error("Synthetic setup unavailable");
  }
  const providers = new AiProviders(
    async (action) => {
      await ready();
      if (action.type === "save") {
        if (scenario === "setup-save-error")
          throw Error("Synthetic provider save failed");
        provider = {
          ...provider,
          revision: provider.revision + 1,
          configuration: action.command.configuration,
          lastRequest: action.command.requestId,
          credentialAvailable:
            !action.command.clearSecret &&
            action.command.configuration.provider === "openai-api",
        };
      }
      return structuredClone(provider);
    },
    () => {},
    report,
  );
  const compute = new AiCompute(
    async (action) => {
      await ready();
      if (action.type === "command") {
        const command = action.command;
        if (command.action.type === "configure")
          computeValue.settings = {
            ...command.action.settings,
            revision: computeValue.settings.revision + 1,
          };
        if (command.action.type === "start")
          computeValue.runtime.state = "serving";
        if (command.action.type === "stop") computeValue.runtime.state = "off";
        computeValue.requestId = command.requestId;
        computeValue.outcome = "completed";
      }
      return structuredClone(computeValue);
    },
    (title, run) => background.run(title, run),
    () => {},
    report,
  );
  return {
    providers,
    compute,
    async close() {
      release();
      await Promise.all([providers.close(), compute.close()]);
    },
  };
}
