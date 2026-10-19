import { registerHistoryResultProvider } from "./search/search-provider.ts";
import type { RepositoryPlugin } from "./repository-plugin.ts";
import type { RepositoryServices } from "../../lib/repository/history-reader.ts";
export function registerRepositoryTools(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  const search = services.search?.indexed
    ? registerHistoryResultProvider(plugin, services.search.indexed)
    : async () => {};
  return async () => {
    await search();
  };
}
