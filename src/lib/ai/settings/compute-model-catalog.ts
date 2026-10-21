// SPDX-License-Identifier: Apache-2.0
// Copied/adapted from jj-store compute-model-catalog.ts; see docs/provenance.json.
export type ComputeModel = {
  id: string;
  name: string;
  installed: boolean;
  bytes?: number | null;
};

// Weight estimates from mesh-llm 9f192c9's catalog; recommendation tiers
// follow Buzz's catalog.rs. Owned presentation data, never a runtime dependency.
const choices = [
  [
    "unsloth/gemma-4-E4B-it-GGUF:Q4_K_M",
    4.6,
    "Compact instruction and tool-calling model",
    true,
  ],
  [
    "unsloth/Qwen3.5-9B-GGUF:Q4_K_M",
    5.8,
    "Balanced reasoning and agent tasks",
    true,
  ],
  [
    "unsloth/Qwen3.8-27B-GGUF:Q4_K_M",
    17.1,
    "Larger reasoning and agent model",
    true,
  ],
  ["unsloth/Qwen3.5-4B-GGUF:Q4_K_M", 2.7, "Lightweight general chat", false],
  [
    "unsloth/Qwen3-8B-GGUF:Q4_K_M",
    5,
    "General chat with thinking modes",
    false,
  ],
  [
    "Qwen/Qwen2.5-Coder-7B-Instruct-GGUF:Q4_K_M",
    4.4,
    "Code generation and completion",
    false,
  ],
  [
    "unsloth/gemma-3-12b-it-GGUF:Q4_K_M",
    7.3,
    "General instruction model",
    false,
  ],
  ["unsloth/Qwen3-14B-GGUF:Q4_K_M", 9, "Stronger chat and reasoning", false],
  [
    "bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M",
    2,
    "Small, fast general chat",
    false,
  ],
  [
    "unsloth/Qwen3-0.6B-GGUF:Q4_K_M",
    0.397,
    "Smallest option for runtime experiments",
    false,
  ],
] as const;

export type ModelFit =
  | "Fits well"
  | "Tight fit"
  | "Trade-off"
  | "Too large"
  | "Fit unknown";
export interface ComputeModelChoice extends ComputeModel {
  sizeGb?: number;
  description: string;
  fit: ModelFit;
  recommended: boolean;
  curated: boolean;
}

function positive(value: unknown): number | undefined {
  const number =
    typeof value === "number" || typeof value === "bigint"
      ? Number(value)
      : NaN;
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export function modelMemoryBudget(
  hardware: unknown,
  limit: unknown,
): number | undefined {
  const memory =
    hardware && typeof hardware === "object"
      ? positive((hardware as Record<string, unknown>).memory_bytes)
      : undefined;
  // Reserve host memory; RAM is an estimate, not measured VRAM or free memory.
  const hostBudget = memory ? (memory / 1e9) * 0.7 : undefined;
  const configured = positive(limit);
  return hostBudget === undefined
    ? undefined
    : Math.min(hostBudget, configured ?? Infinity);
}

export function modelFit(
  size: number | undefined,
  budget: number | undefined,
): ModelFit {
  if (size === undefined || budget === undefined) return "Fit unknown";
  if (size <= budget * 0.6) return "Fits well";
  if (size <= budget * 0.9) return "Tight fit";
  if (size <= budget * 1.1) return "Trade-off";
  return "Too large";
}

export function computeModelChoices(
  models: readonly ComputeModel[],
  hardware: unknown,
  limit: unknown,
  selected: string | null,
): ComputeModelChoice[] {
  const budget = modelMemoryBudget(hardware, limit);
  const rows = new Map<string, ComputeModelChoice>(
    choices.map(([id, sizeGb, description, curated]) => [
      id,
      {
        id,
        name: id,
        installed: false,
        sizeGb,
        description,
        curated,
        fit: modelFit(sizeGb, budget),
        recommended: false,
      },
    ]),
  );
  for (const model of models) {
    const known = rows.get(model.id);
    const sizeGb = positive(model.bytes)
      ? Number(model.bytes) / 1e9
      : known?.sizeGb;
    rows.set(
      model.id,
      known
        ? {
            ...known,
            name: model.name,
            installed: model.installed,
            sizeGb,
            fit: modelFit(sizeGb, budget),
          }
        : {
            ...model,
            sizeGb,
            description: model.installed
              ? "Installed weights on this device"
              : "Model files are missing",
            curated: false,
            fit: modelFit(sizeGb, budget),
            recommended: false,
          },
    );
  }
  if (selected && !rows.has(selected))
    rows.set(selected, {
      id: selected,
      name: selected,
      installed: false,
      description: "Custom model; size estimate unavailable",
      curated: false,
      fit: "Fit unknown",
      recommended: false,
    });
  const all = [...rows.values()];
  const memory =
    hardware && typeof hardware === "object"
      ? positive((hardware as Record<string, unknown>).memory_bytes)
      : undefined;
  const tier =
    memory && memory / 1e9 >= 64 ? 2 : memory && memory / 1e9 >= 32 ? 1 : 0;
  const preferred =
    all.find((row) => row.id === choices[tier][0] && row.fit === "Fits well") ??
    all
      .filter((row) => row.fit === "Fits well")
      .sort((a, b) => (b.sizeGb ?? 0) - (a.sizeGb ?? 0))[0];
  if (preferred) preferred.recommended = true;
  return all.sort(
    (a, b) =>
      Number(b.recommended) - Number(a.recommended) ||
      Number(b.installed) - Number(a.installed) ||
      Number(b.curated) - Number(a.curated),
  );
}

export function modelSizeLabel(size?: number): string {
  return size === undefined
    ? "Size unknown"
    : size < 1
      ? `${Math.round(size * 1000)} MB`
      : `${size.toFixed(1)} GB`;
}
