// SPDX-License-Identifier: Apache-2.0
// Adapted from Lapis AiPlugin settings persistence; see ../NOTICE.md.
import {
  mergeAiSettings,
  type AiPluginSettings,
  type AppToolEnablementRef,
} from "./ai-settings.ts";
import {
  equalAiPluginData,
  parseAiPluginData,
  serializeAiPluginData,
} from "../sessions/plugin-data.ts";

export type AiSettingsPatch =
  | Partial<AiPluginSettings>
  | ((current: AiPluginSettings) => Partial<AiPluginSettings>);

/** Plugin data is the sole writer; a failed save never publishes new defaults. */
export class AiSettingsStore {
  #data = parseAiPluginData(null);
  #tail: Promise<void> = Promise.resolve();
  #listeners = new Set<(patch: Partial<AiPluginSettings>) => void>();
  constructor(
    private readonly save: (data: Record<string, unknown>) => Promise<void>,
    private readonly registeredTools: () => readonly AppToolEnablementRef[] = () => [],
  ) {}

  /** Hydrate the owned plugin before registering its settings and views. */
  hydrate(value: unknown): void {
    this.#data = parseAiPluginData(value);
  }
  get(): AiPluginSettings {
    return structuredClone(this.#data.settings);
  }
  update(change: AiSettingsPatch): Promise<void> {
    const operation = this.#tail.then(async () => {
      const patch = typeof change === "function" ? change(this.get()) : change;
      const current = this.#data.settings;
      const acpAgent = patch.acpAgent ?? current.acpAgent;
      const defaultModels = {
        ...current.defaultModels,
        ...patch.defaultModels,
      };
      if (patch.defaultModel !== undefined)
        defaultModels[acpAgent] = patch.defaultModel.trim();
      const next = {
        ...this.#data,
        settings: mergeAiSettings(
          { ...current, ...patch, acpAgent, defaultModels },
          this.registeredTools(),
        ),
      };
      if (equalAiPluginData(this.#data, next)) return;
      await this.save(serializeAiPluginData(next));
      this.#data = next;
      for (const listener of this.#listeners) listener(patch);
    });
    this.#tail = operation.catch(() => {});
    return operation;
  }
  subscribe(listener: (patch: Partial<AiPluginSettings>) => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  async settle(): Promise<void> {
    await this.#tail;
  }
}
