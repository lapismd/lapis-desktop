// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
/** An installed or App Shell disabling remains authoritative after bundling. */
export async function aiEnabledByDefault(
  app: Pick<App, "vault">,
): Promise<boolean> {
  const adapter = app.vault.adapter;
  for (const path of [
    ".lapis/app-shell-plugins.json",
    ".lapis/installed-plugins.json",
  ]) {
    if (!(await adapter.exists(path))) continue;
    const saved: unknown = JSON.parse(await adapter.read(path));
    if (!saved || typeof saved !== "object" || Array.isArray(saved))
      throw new Error(`Invalid saved AI preferences in ${path}`);
    const data = saved as Record<string, unknown>;
    if (path.endsWith("app-shell-plugins.json") && data.ai === false)
      return false;
    const plugins = data.plugins;
    if (plugins && typeof plugins === "object" && !Array.isArray(plugins)) {
      const ai = (plugins as Record<string, unknown>).ai;
      if (
        ai &&
        typeof ai === "object" &&
        "enabled" in ai &&
        ai.enabled === false
      )
        return false;
    }
  }
  return true;
}
