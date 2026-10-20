import {
  executionModesFromSession,
  type ExecutionMode,
} from "../../ai/core/agent-profile.ts";
import type { AcpTransport, SessionInfo } from "@lapismd/ai";
import type { AiModelCatalog } from "../../ai/settings/model-options.ts";
import type { ModelRef } from "../../ai/core/models.ts";
import { record } from "../../ai/runtimes/acp/wire.ts";

export const MODEL_CATALOG_MAX_AGE_MS = 5 * 60_000;
type ProviderCatalog = { models: ModelRef[]; modes: ExecutionMode[] };
type DiscoveryOptions = {
  available?: () => boolean;
  work?: (
    load: () => Promise<ProviderCatalog | null>,
  ) => Promise<ProviderCatalog | null>;
  now?: () => number;
};
/** Read actual advertised models without sending a prompt or choosing a fallback. */
export class NativeAiModels implements AiModelCatalog {
  readonly #pending = new Map<string, Promise<ProviderCatalog | null>>();
  readonly #cache = new Map<
    string,
    { facts: ProviderCatalog; expires: number }
  >();
  readonly #cleanup = new Set<string>();
  #generation = 0;
  #closed = false;
  constructor(
    private readonly transport: AcpTransport,
    private readonly options: DiscoveryOptions = {},
  ) {}
  invalidate(): void {
    this.#generation++;
    this.#cache.clear();
  }
  async listModels(provider: string, runtime = "acp"): Promise<ModelRef[]> {
    return structuredClone(
      (await this.#facts(provider, runtime))?.models ?? [],
    );
  }
  async listExecutionModes(
    provider: string,
    runtime = "acp",
  ): Promise<ExecutionMode[]> {
    return structuredClone((await this.#facts(provider, runtime))?.modes ?? []);
  }
  #facts(provider: string, runtime: string): Promise<ProviderCatalog | null> {
    if (this.#closed)
      return Promise.reject(new Error("AI model catalog is closed"));
    if (this.options.available?.() === false) {
      this.invalidate();
      return Promise.reject(new Error("AI is disabled in this workspace"));
    }
    if (runtime !== "acp" && runtime !== "auto")
      return Promise.reject(
        new Error(`Saved runtime ${runtime} is unavailable.`),
      );
    const cached = this.#cache.get(provider);
    if (cached && cached.expires > (this.options.now?.() ?? Date.now()))
      return Promise.resolve(cached.facts);
    const generation = this.#generation;
    const key = `${generation}:${provider}`;
    const pending = this.#pending.get(key);
    if (pending) return pending;
    const load = async () => {
      const facts = await this.#load(provider);
      if (generation !== this.#generation)
        throw new Error("AI model discovery changed; retry the request");
      if (!this.#closed && facts) {
        this.#cache.set(provider, {
          facts,
          expires:
            (this.options.now?.() ?? Date.now()) + MODEL_CATALOG_MAX_AGE_MS,
        });
      }
      return facts;
    };
    const reading = (this.options.work?.(load) ?? load()).finally(() =>
      this.#pending.delete(key),
    );
    this.#pending.set(key, reading);
    return reading;
  }
  async #load(provider: string): Promise<ProviderCatalog | null> {
    const targets = await this.transport.targets();
    if (this.#closed || !targets.some((target) => target.id === provider))
      return null;
    const requestId = crypto.randomUUID();
    let info: SessionInfo | undefined;
    let failure: unknown;
    try {
      info = await this.transport.open({ targetId: provider, requestId });
      this.#cleanup.add(info.sessionId);
      return {
        models: modelsFromFacts(info.facts, provider),
        modes: executionModesFromSession(record(info.facts).session),
      };
    } catch (error) {
      failure = error;
      if (!info) {
        // Locate a potentially acknowledged open once; never replay it.
        try {
          const owned = (await this.transport.list()).filter(
            (entry) => entry.requestId === requestId,
          );
          for (const entry of owned) this.#cleanup.add(entry.sessionId);
          for (const entry of owned) {
            await this.transport.close(entry.sessionId);
            this.#cleanup.delete(entry.sessionId);
          }
        } catch (cleanup) {
          throw new AggregateError(
            [error, cleanup],
            "AI model catalog startup cleanup failed",
          );
        }
      }
      throw error;
    } finally {
      if (info) {
        try {
          await this.transport.close(info.sessionId);
        } catch (cleanup) {
          if (failure)
            throw new AggregateError(
              [failure, cleanup],
              "AI model catalog cleanup failed",
            );
          throw cleanup;
        }
        this.#cleanup.delete(info.sessionId);
      }
    }
  }
  async close(): Promise<void> {
    this.#closed = true;
    this.#cache.clear();
    await Promise.allSettled(this.#pending.values());
    const results = await Promise.allSettled(
      [...this.#cleanup].map(async (id) => {
        await this.transport.close(id);
        this.#cleanup.delete(id);
      }),
    );
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "AI model probe cleanup failed");
  }
}

export function modelsFromFacts(facts: unknown, provider: string): ModelRef[] {
  const models = record(record(record(facts).session).models);
  if (models.availableModels === undefined) return [];
  if (
    !Array.isArray(models.availableModels) ||
    models.availableModels.length > 512
  )
    throw new Error("Invalid native model catalog");
  const seen = new Set<string>();
  return models.availableModels.map((value) => {
    const entry = record(value);
    if (
      typeof entry.modelId !== "string" ||
      !entry.modelId.trim() ||
      entry.modelId.length > 256 ||
      seen.has(entry.modelId)
    )
      throw new Error("Invalid native model catalog entry");
    seen.add(entry.modelId);
    return {
      provider,
      model: entry.modelId,
      ...(typeof entry.name === "string" ? { displayName: entry.name } : {}),
      ...(typeof entry.description === "string"
        ? { description: entry.description }
        : {}),
      isDefault: entry.modelId === models.currentModelId,
    };
  });
}
