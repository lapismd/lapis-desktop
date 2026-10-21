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
  #transaction?: (
    current: AiPluginSettings,
    next: AiPluginSettings,
    save: () => Promise<void>,
  ) => Promise<void>;
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
  hasStoredSetting(key: keyof AiPluginSettings): boolean {
    const source = this.#data.source.settings ?? this.#data.source;
    return Boolean(source && typeof source === "object" && key in source);
  }
  persistDefaults(): Promise<void> {
    return this.update({}, true);
  }
  update(change: AiSettingsPatch, force = false): Promise<void> {
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
      if (!force && equalAiPluginData(this.#data, next)) return;
      const save = () => this.save(serializeAiPluginData(next));
      if (this.#transaction)
        await this.#transaction(current, next.settings, save);
      else await save();
      next.source = serializeAiPluginData(next);
      this.#data = next;
      for (const listener of this.#listeners) listener(patch);
    });
    this.#tail = operation.catch(() => {});
    return operation;
  }
  useTransaction(
    transaction: (
      current: AiPluginSettings,
      next: AiPluginSettings,
      save: () => Promise<void>,
    ) => Promise<void>,
  ): () => void {
    this.#transaction = transaction;
    return () => {
      if (this.#transaction === transaction) this.#transaction = undefined;
    };
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
