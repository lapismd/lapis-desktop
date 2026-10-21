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
  const provider: ProviderStatus = {
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
        id: "openai-compat",
        label: "OpenAI compatible",
        default_endpoint: null,
        endpoint_required: true,
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
    models: [
      "setup-running",
      "setup-downloaded",
      "setup-missing",
      "setup-model-table",
    ].includes(scenario)
      ? [
          {
            id: "unsloth/Qwen3-0.6B-GGUF:Q4_K_M",
            name: "Qwen3 0.6B · Q4_K_M",
            installed: scenario !== "setup-missing",
            bytes: scenario === "setup-missing" ? null : 396705472,
          },
        ]
      : [],
    runtimePrepared: scenario !== "setup-preparing",
    hardware: {
      memory_bytes: scenario === "setup-unknown-hardware" ? null : 16e9,
    },
    settings: {
      revision: 0,
      model:
        scenario === "setup-unknown-hardware"
          ? "custom/model:Q8"
          : "unsloth/Qwen3-0.6B-GGUF:Q4_K_M",
      memoryGb: null,
      sharing: false,
      peers: {},
      targetPeer: null,
    },
    requestId: null,
    outcome:
      scenario === "setup-compute-unknown"
        ? "unknown"
        : scenario === "setup-compute-failed"
          ? "failed"
          : null,
    runtime: {
      state: scenario === "setup-running" ? "serving" : "off",
      ownerId: scenario === "setup-running" ? crypto.randomUUID() : null,
      activeModel:
        scenario === "setup-running" ? "unsloth/Qwen3-0.6B-GGUF:Q4_K_M" : null,
      invitation: null,
      progress:
        scenario === "setup-downloading"
          ? {
              action: "download",
              label: "Qwen3 0.6B",
              file: "Qwen3-0.6B-Q4_K_M.gguf",
              downloaded_bytes: 198352736,
              total_bytes: 396705472,
            }
          : scenario === "setup-preparing"
            ? { action: "prepare" }
            : null,
    },
  };
  const background = new BackgroundWork(app.notifications, "ai");
  const commands: string[] = [];
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
  const profiles = new Map<string, AiProviders>();
  const states = new Map<string, ProviderStatus>();
  function agentProviders(profileId?: string) {
    const id = profileId ?? "legacy";
    const existing = profiles.get(id);
    if (existing) return existing;
    let value = structuredClone(provider);
    if (id !== "legacy")
      value = {
        ...value,
        revision: 0,
        credentialAvailable: false,
        configuration: { provider: "", endpoint: null, model: null },
      };
    if (id === "qwen")
      value = {
        ...value,
        revision: 1,
        credentialAvailable: true,
        configuration: {
          provider: "openai-compat",
          endpoint: "https://models.example/v1",
          model: "qwen3.8-max",
        },
      };
    if (id === "local-model")
      value = {
        ...value,
        revision: 1,
        configuration: { provider: "local", endpoint: null, model: null },
      };
    states.set(id, value);
    const manager = new AiProviders(
      async (action) => {
        await ready();
        if (action.type === "save") {
          if (scenario === "setup-save-error")
            throw Error("Synthetic provider save failed");
          value = {
            ...value,
            revision: value.revision + 1,
            configuration: action.command.configuration,
            lastRequest: action.command.requestId,
            credentialAvailable:
              !action.command.clearSecret &&
              Boolean(action.command.secret || value.credentialAvailable),
          };
          states.set(id, value);
        }
        return structuredClone(value);
      },
      () => {},
      report,
    );
    profiles.set(id, manager);
    return manager;
  }
  const providers = agentProviders();
  if (scenario === "setup-model-table")
    computeValue.models.push({
      id: "imported-fixture-local-assistant",
      name: "Local assistant.gguf",
      installed: true,
      bytes: 1200000000,
    });
  const compute = new AiCompute(
    async (action) => {
      await ready();
      if (action.type === "command") {
        const command = action.command;
        commands.push(command.action.type);
        if (command.action.type === "configure")
          computeValue.settings = {
            ...command.action.settings,
            revision: computeValue.settings.revision + 1,
          };
        if (command.action.type === "start") {
          computeValue.runtime.state = "serving";
          computeValue.runtime.activeModel = computeValue.settings.model;
        }
        if (command.action.type === "prepare")
          computeValue.runtimePrepared = true;
        if (
          command.action.type === "download" ||
          command.action.type === "import"
        ) {
          const imported = command.action.type === "import";
          const id = imported
            ? "imported-fixture"
            : computeValue.settings.model!;
          if (imported) computeValue.runtime.importedModel = id;
          if (!computeValue.models.some((m) => m.id === id))
            computeValue.models.push({
              id,
              name: imported ? "Qwen3 imported.gguf" : id,
              installed: true,
              bytes: 396705472,
            });
        }
        if (command.action.type === "remove") {
          const removed = command.action.model;
          computeValue.models = computeValue.models.filter(
            (model) => model.id !== removed,
          );
        }
        if (command.action.type === "stop") computeValue.runtime.state = "off";
        computeValue.requestId = command.requestId;
        computeValue.outcome = "completed";
        if (
          scenario === "setup-compute-failed" &&
          command.action.type === "download"
        ) {
          computeValue.outcome = "failed";
          computeValue.failure = {
            code: "download_failed",
            message:
              "The download failed. Check the model reference and network connection, then retry.",
          };
          computeValue.runtime.state = "attention";
        }
      }
      return structuredClone(computeValue);
    },
    (title, run) => background.run(title, run),
    () => {},
    report,
    async () => {
      if (scenario === "setup-file-error")
        throw new Error("Synthetic file chooser unavailable");
      return "/models/Qwen3-0.6B-Q4_K_M.gguf";
    },
  );
  return {
    commands,
    providers,
    agentProviders,
    states,
    compute,
    async close() {
      release();
      await Promise.all(
        [...profiles.values()].map((profile) => profile.close()),
      );
      await compute.close();
    },
  };
}
