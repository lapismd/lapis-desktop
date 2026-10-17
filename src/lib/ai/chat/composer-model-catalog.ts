// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import type { ModelRef } from "../core/models.ts";
import type { AcpAgentId } from "../settings/acp-agents.ts";
import type { AiPluginSettings } from "../settings/ai-settings.ts";

export type ComposerModelCatalogState = {
  agent: AcpAgentId;
  runtime: AiPluginSettings["defaultRuntime"];
  models: ModelRef[];
  model: string;
  loading: boolean;
  error: string | null;
};

/** Each selection owns its result; a previous harness cannot overwrite it. */
export class ComposerModelCatalog {
  #generation = 0;
  constructor(
    readonly load: (
      agent: AcpAgentId,
      runtime: AiPluginSettings["defaultRuntime"],
    ) => Promise<ModelRef[]>,
    readonly update: (state: ComposerModelCatalogState) => void,
  ) {}
  async refresh(
    agent: AcpAgentId,
    runtime: AiPluginSettings["defaultRuntime"],
    saved: string,
  ): Promise<void> {
    const generation = ++this.#generation;
    const state: ComposerModelCatalogState = {
      agent,
      runtime,
      models: [],
      model: saved,
      loading: true,
      error: null,
    };
    this.update(state);
    try {
      const models = (await this.load(agent, runtime)).filter(
        (model) => model.provider === agent || !model.provider,
      );
      if (generation !== this.#generation) return;
      const model = models.some((entry) => entry.model === saved)
        ? saved
        : ((models.find((entry) => entry.isDefault) ?? models[0])?.model ??
          saved);
      this.update({ ...state, models, model, loading: false });
    } catch (error) {
      if (generation !== this.#generation) return;
      this.update({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  cancel(): void {
    this.#generation++;
  }
}
