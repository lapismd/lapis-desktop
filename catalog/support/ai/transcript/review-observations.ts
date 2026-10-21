import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { AiPluginSettings } from "../../../../src/lib/ai/settings/ai-settings.ts";
export function extraReviewValue(
  name: string,
  settings: AiPluginSettings,
  app: App,
): string | undefined {
  if (name === "settings") return JSON.stringify(settings);
  if (name === "notifications")
    return JSON.stringify(
      getWorkspaceHostBinding(app.workspace).controller.notifications.transient,
    );
}
