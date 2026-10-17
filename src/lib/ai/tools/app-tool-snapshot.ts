// SPDX-License-Identifier: Apache-2.0
// Retained Lapis application-tool policy; see ../NOTICE.md.
import type { RegisteredAppTool } from "@lapis-notes/api/agent-tools";
import type {
  AppToolDescriptor,
  AppToolSessionDescriptor,
} from "../core/runtime.ts";
import { isAppToolEnabled } from "../settings/ai-settings.ts";
import type { AppToolPolicySettings } from "./app-tool-contracts.ts";
export function isEligible(
  registered: RegisteredAppTool,
  settings: AppToolPolicySettings,
): boolean {
  return isAppToolEnabled(
    { name: registered.tool.name, owner: registered.owner },
    settings,
  );
}

export function toDescriptor(registered: RegisteredAppTool): AppToolDescriptor {
  return Object.freeze({
    registrationId: registered.registrationId,
    ownerPluginId: registered.owner.pluginId,
    name: registered.tool.name,
    description: registered.tool.description,
    inputSchema: cloneJson(registered.tool.inputSchema),
    outputSchema: registered.tool.outputSchema
      ? cloneJson(registered.tool.outputSchema)
      : undefined,
    effect: registered.tool.effect,
  });
}

function cloneJson<T>(value: T): T {
  return deepFreezeJson(JSON.parse(JSON.stringify(value)) as T);
}

function deepFreezeJson<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) deepFreezeJson(nested);
  return Object.freeze(value);
}

export function grantKey(
  session: AppToolSessionDescriptor,
  registered: RegisteredAppTool,
): string {
  return [
    "",
    session.conversationId,
    session.agentBindingId,
    session.scopeDir,
    registered.owner.pluginId,
    registered.tool.name,
    registered.tool.effect,
    "",
  ].join("\u0000");
}
