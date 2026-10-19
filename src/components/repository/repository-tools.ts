import { registerHistorySearch } from "./search/search-view.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
export function registerRepositoryTools(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  const search = registerHistorySearch(plugin, services.search);
  return async () => {
    await search();
  };
}
