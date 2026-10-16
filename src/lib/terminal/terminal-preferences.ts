import type { App } from "@lapis-notes/api";

/** Saved explicit disabling survives the switch from installed to bundled. */
export async function terminalEnabledByDefault(
  app: Pick<App, "vault">,
): Promise<boolean> {
  const adapter = app.vault.adapter;
  for (const [path, disabled] of [
    [
      ".lapis/app-shell-plugins.json",
      (value: Record<string, unknown>) => value.terminal === false,
    ],
    [
      ".lapis/installed-plugins.json",
      (value: Record<string, unknown>) => {
        const plugins = value.plugins as
          | Record<string, { enabled?: boolean }>
          | undefined;
        return plugins?.terminal?.enabled === false;
      },
    ],
  ] as const) {
    if (!(await adapter.exists(path))) continue;
    const value: unknown = JSON.parse(await adapter.read(path));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error(`Invalid saved Terminal preferences in ${path}`);
    if (disabled(value as Record<string, unknown>)) return false;
  }
  return true;
}
