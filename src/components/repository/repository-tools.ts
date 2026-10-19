import { registerBackupSettings } from "./backup/forge-view.ts";
import { registerHistorySearch } from "./search/search-view.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
export function registerRepositoryTools(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  const accounts = registerBackupSettings(plugin, services);
  const search = registerHistorySearch(plugin, services.search);
  return async () => {
    await Promise.all([accounts?.(), search()]);
  };
}
