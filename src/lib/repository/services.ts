import type { App } from "@lapis-notes/api";
import type {
  RepositoryServices,
  RepositoryLeaveMode,
} from "./history-reader.ts";

export type RepositoryFactory = (app: App) => RepositoryServices;
const bindings = new WeakMap<App, RepositoryFactory>();
const leaveModes = new WeakMap<App, RepositoryLeaveMode>();
export function bindRepository(
  app: App,
  factory: RepositoryFactory,
): () => void {
  if (bindings.has(app)) throw new Error("Repository history is already bound");
  bindings.set(app, factory);
  return () => {
    if (bindings.get(app) === factory) bindings.delete(app);
  };
}
export function ownedRepository(app: App): RepositoryServices {
  const factory = bindings.get(app);
  if (!factory)
    throw new Error("Repository history is unavailable in this host");
  return factory(app);
}
export function prepareRepositoryLeave(
  app: App,
  mode: RepositoryLeaveMode,
): void {
  leaveModes.set(app, mode);
}
export function repositoryLeaveMode(app: App): RepositoryLeaveMode {
  return leaveModes.get(app) ?? "close";
}
