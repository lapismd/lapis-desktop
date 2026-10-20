import type { AgentRequest } from "../../core/runtime.ts";
import { buildAvailableSkillsManifest } from "../../skills/manifest.ts";

/** Freeze app-owned context before provider startup; no authored text is changed. */
export function initialAcpContext(request: AgentRequest): string | undefined {
  const parts: string[] = [];
  const bootstrap = request.metadata?.sessionBootstrap;
  if (bootstrap !== undefined) {
    if (typeof bootstrap !== "string" || bootstrap.length > 64 * 1024)
      throw new Error("Invalid AI session bootstrap");
    if (bootstrap) parts.push(bootstrap);
  }
  if (request.skillSnapshot) {
    if (
      !Array.isArray(request.skillSnapshot.skills) ||
      request.skillSnapshot.skills.length > 128
    )
      throw new Error("Invalid AI skill snapshot");
    parts.push(buildAvailableSkillsManifest(request.skillSnapshot));
  }
  const activations = request.skillActivations ?? [];
  if (!Array.isArray(activations) || activations.length > 16)
    throw new Error("Invalid AI skill activations");
  for (const activation of activations) {
    if (
      !activation ||
      typeof activation.instructions !== "string" ||
      activation.instructions.length > 64 * 1024 ||
      typeof activation.skillId !== "string" ||
      typeof activation.version !== "string"
    )
      throw new Error("Invalid AI skill activation");
    const text = JSON.stringify({
      skillId: activation.skillId,
      version: activation.version,
      arguments: activation.arguments,
      instructions: activation.instructions,
    });
    parts.push(
      `Application-selected skill instructions; application permissions still apply.\n<skill-activation>\n${escape(text)}\n</skill-activation>`,
    );
  }
  const context = parts.filter(Boolean).join("\n\n");
  if (new TextEncoder().encode(context).length > 128 * 1024)
    throw new Error("AI initial context exceeds its limit");
  return context || undefined;
}
function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
