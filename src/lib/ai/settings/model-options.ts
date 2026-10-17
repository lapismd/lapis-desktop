// SPDX-License-Identifier: Apache-2.0
// Adapted from the Lapis AI model setting source; see ../NOTICE.md.
import type { ModelRef } from "../core/models.ts";
import type { AcpAgentId } from "./acp-agents.ts";
import type { AiSettingsStore } from "./settings-store.ts";

export type AiModelCatalog = {
  listModels(provider: string, runtime?: string): Promise<ModelRef[]>;
};

/** Inventory results belong to their provider, request and registering plugin. */
export class AiModelOptions {
  #closed = false;
  #generations = new Map<AcpAgentId, number>();
  constructor(
    private readonly store: AiSettingsStore,
    private readonly models: AiModelCatalog,
    private readonly report: (error: unknown) => void,
  ) {}

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
  #current(provider: AcpAgentId, generation: number): boolean {
    return !this.#closed && this.#generations.get(provider) === generation;
  }
  close(): void {
    this.#closed = true;
    this.#generations.clear();
  }
}
