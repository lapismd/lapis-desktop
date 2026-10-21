// SPDX-License-Identifier: Apache-2.0
// Adapted from the Lapis AI model setting source; see ../NOTICE.md.
import type { ModelRef } from "../core/models.ts";
import type { AcpAgentId } from "./acp-agents.ts";
import type { AiSettingsStore } from "./settings-store.ts";

export type AiModelCatalog = {
  listExecutionModes?(
    provider: string,
    runtime?: string,
    profileId?: string,
  ): Promise<import("../core/agent-profile.ts").ExecutionMode[]>;
  listModels(
    provider: string,
    runtime?: string,
    profileId?: string,
  ): Promise<ModelRef[]>;
};

/** Inventory results belong to their provider, request and registering plugin. */
export class AiModelOptions {
  #closed = false;
  #generations = new Map<string, number>();
  constructor(
    private readonly store: AiSettingsStore,
    private readonly models: AiModelCatalog,
    private readonly report: (error: unknown) => void,
  ) {}

  async loadProcessor(kind: "memory" | "handoff") {
    if (this.#closed) throw new Error("AI settings are unavailable");
    const target = () => {
      const settings = this.store.get();
      return kind === "memory"
        ? {
            agent: settings.memoryConsolidationAgent,
            runtime: settings.memoryConsolidationRuntime,
            model: settings.memoryConsolidationModel,
          }
        : {
            agent: settings.handoffSummaryAgent,
            runtime: settings.handoffSummaryRuntime,
            model: settings.handoffSummaryModel,
          };
    };
    const selected = target();
    const key = `processor:${kind}`;
    const generation = (this.#generations.get(key) ?? 0) + 1;
    this.#generations.set(key, generation);
    const current = () =>
      this.#current(key, generation) &&
      target().agent === selected.agent &&
      target().runtime === selected.runtime;
    const saved = (description: string) => {
      const { model } = target();
      return model ? [{ value: model, label: model, description }] : [];
    };
    if (selected.runtime !== "acp")
      return saved(`Saved runtime ${selected.runtime} is unavailable.`);
    try {
      // Native discovery owns the shared agent/profile cache and probe cleanup.
      const models = (
        await this.models.listModels(selected.agent, selected.runtime)
      ).filter((model) => model.provider === selected.agent || !model.provider);
      if (!current()) return [];
      const options = models.map((model) => ({
        value: model.model,
        label: model.displayName ?? model.model,
        description: model.badges?.length
          ? model.badges.join(" · ")
          : model.description,
      }));
      return [
        ...saved(
          models.length
            ? "Saved model; it is not in the current catalog."
            : "Saved model; the provider returned no catalog.",
        ).filter(
          (entry) => !options.some((option) => option.value === entry.value),
        ),
        ...options,
      ];
    } catch (error) {
      if (!current()) return [];
      this.report(error);
      return saved(
        `Saved model; catalog unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async load(provider: AcpAgentId) {
    if (this.#closed) throw new Error("AI settings are unavailable");
    const generation = (this.#generations.get(provider) ?? 0) + 1;
    this.#generations.set(provider, generation);
    const saved = this.store.get().defaultModels[provider];
    let models: ModelRef[];
    try {
      models = (await this.models.listModels(provider, "acp")).filter(
        (model) => model.provider === provider || !model.provider,
      );
    } catch (error) {
      if (!this.#current(provider, generation)) return [];
      this.report(error);
      return this.#saved(
        provider,
        `Saved model; catalog unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (!this.#current(provider, generation)) return [];
    if (!models.length)
      return this.#saved(
        provider,
        "Saved model; the provider returned no catalog.",
      );
    const selected = models.some((model) => model.model === saved)
      ? saved
      : (models.find((model) => model.isDefault) ?? models[0])!.model;
    if (selected !== saved) {
      try {
        await this.store.update((current) => {
          const deferred =
            current.defaultRuntime !== "auto" &&
            current.defaultRuntime !== "acp";
          if (
            !this.#current(provider, generation) ||
            current.defaultModels[provider] !== saved ||
            (deferred && current.acpAgent === provider)
          )
            return {};
          return {
            defaultModels: { ...current.defaultModels, [provider]: selected },
          };
        });
      } catch (error) {
        if (!this.#current(provider, generation)) return [];
        this.report(error);
      }
    }
    if (!this.#current(provider, generation)) return [];
    const options = models.map((model) => ({
      value: model.model,
      label: model.displayName ?? model.model,
      description: model.badges?.length
        ? model.badges.join(" · ")
        : model.description,
    }));
    const currentSaved = this.#saved(
      provider,
      "Saved model; it is not in the current catalog.",
    );
    return [
      ...currentSaved.filter(
        (saved) => !options.some((option) => option.value === saved.value),
      ),
      ...options,
    ];
  }
  #saved(provider: AcpAgentId, description: string) {
    const value = this.store.get().defaultModels[provider];
    return value ? [{ value, label: value, description }] : [];
  }
  #current(provider: string, generation: number): boolean {
    return !this.#closed && this.#generations.get(provider) === generation;
  }
  close(): void {
    this.#closed = true;
    this.#generations.clear();
  }
}
