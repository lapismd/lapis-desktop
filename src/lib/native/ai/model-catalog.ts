import type { AcpTransport, SessionInfo } from "@lapismd/ai";
import type { AiModelCatalog } from "../../ai/settings/model-options.ts";
import type { ModelRef } from "../../ai/core/models.ts";
import { record } from "../../ai/runtimes/acp/wire.ts";

/** Read actual advertised models without sending a prompt or choosing a fallback. */
export class NativeAiModels implements AiModelCatalog {
  readonly #pending = new Map<string, Promise<ModelRef[]>>();
  readonly #cleanup = new Set<string>();
  #closed = false;
  constructor(private readonly transport: AcpTransport) {}
  listModels(provider: string, runtime = "acp"): Promise<ModelRef[]> {
    if (this.#closed)
      return Promise.reject(new Error("AI model catalog is closed"));
    if (runtime !== "acp" && runtime !== "auto")
      return Promise.reject(
        new Error(`Saved runtime ${runtime} is unavailable.`),
      );
    const pending = this.#pending.get(provider);
    if (pending) return pending;
    const reading = this.#load(provider).finally(() =>
      this.#pending.delete(provider),
    );
    this.#pending.set(provider, reading);
    return reading;
  }
  async #load(provider: string): Promise<ModelRef[]> {
    const targets = await this.transport.targets();
    if (this.#closed || !targets.some((target) => target.id === provider))
      return [];
    const requestId = crypto.randomUUID();
    let info: SessionInfo | undefined;
    let failure: unknown;
    try {
      info = await this.transport.open({ targetId: provider, requestId });
      this.#cleanup.add(info.sessionId);
      return modelsFromFacts(info.facts, provider);
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
