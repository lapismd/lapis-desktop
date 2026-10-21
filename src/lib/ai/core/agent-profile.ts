// SPDX-License-Identifier: Apache-2.0
export type AgentProfileContext = {
  name?: string;
  description?: string;
  instructions?: string;
};
export type ExecutionMode = { id: string; name: string; description?: string };
export function assertExecutionMode(
  value: unknown,
): asserts value is string | undefined {
  if (
    value !== undefined &&
    (typeof value !== "string" ||
      !value.trim() ||
      value.length > 256 ||
      /[\x00-\x1f\x7f]/u.test(value))
  )
    throw new Error("Invalid agent execution mode");
}
export function validateAgentProfile(
  value: unknown,
): AgentProfileContext | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid agent context");
  const profile = value as AgentProfileContext;
  if (
    Object.keys(profile).some(
      (k) => !["name", "description", "instructions"].includes(k),
    )
  )
    throw new Error("Invalid agent context field");
  for (const [key, limit] of [
    ["name", 80],
    ["description", 280],
    ["instructions", 32768],
  ] as const) {
    const text = profile[key];
    if (
      text !== undefined &&
      (typeof text !== "string" ||
        text.includes("\0") ||
        (key === "instructions"
          ? new TextEncoder().encode(text).length
          : [...text].length) > limit)
    )
      throw new Error(`Invalid agent ${key}`);
  }
  return structuredClone(profile);
}
export const defaultExecutionMode = (provider?: string) =>
  provider === "codex" ? "read-only" : provider === "opencode" ? "plan" : "ask";
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
/** Match the shared runner: a mode must be a mode config value, not a collaboration mode. */
export function executionModesFromSession(session: unknown): ExecutionMode[] {
  const raw = object(session);
  const configs = Array.isArray(raw.configOptions) ? raw.configOptions : [];
  const advertised = object(raw.modes).availableModes;
  const modes = Array.isArray(advertised) ? advertised.map(object) : [];
  const result: ExecutionMode[] = [];
  const add = (values: unknown[], depth = 0) => {
    if (depth > 4 || values.length > 64)
      throw new Error("Invalid execution mode catalog");
    for (const v of values) {
      const option = object(v);
      if (Array.isArray(option.options)) {
        add(option.options, depth + 1);
        continue;
      }
      assertExecutionMode(option.value);
      if (
        option.value === undefined ||
        (modes.length && !modes.some((m) => m.id === option.value))
      )
        continue;
      if (result.some((m) => m.id === option.value) || result.length >= 64)
        throw new Error("Invalid execution mode catalog");
      const details = modes.find((m) => m.id === option.value);
      result.push({
        id: option.value,
        name:
          typeof option.name === "string"
            ? option.name.slice(0, 256)
            : option.value,
        ...(typeof details?.description === "string"
          ? { description: details.description.slice(0, 2048) }
          : {}),
      });
    }
  };
  for (const config of configs.map(object))
    if (
      config.category === "mode" &&
      typeof config.id === "string" &&
      Array.isArray(config.options)
    )
      add(config.options);
  return result;
}
export function agentProfileContext(
  profile?: AgentProfileContext,
): string | undefined {
  const saved = validateAgentProfile(profile);
  if (!saved || (!saved.instructions && !saved.description)) return;
  const escape = (v: string) =>
    v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `User-configured agent context for this session. Instructions remain subject to application permissions.\n<agent-profile>\n${escape(JSON.stringify(saved))}\n</agent-profile>`;
}

/** Freeze at session creation and consume only when the first prompt dispatches. */
export class InitialAgentContext {
  #context?: string;
  constructor(profile?: AgentProfileContext) {
    this.#context = agentProfileContext(profile);
  }
  apply(prepared: { context?: string }) {
    if (!this.#context) return;
    prepared.context = [this.#context, prepared.context]
      .filter(Boolean)
      .join("\n\n");
    this.#context = undefined;
  }
}
