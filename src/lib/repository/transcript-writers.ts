// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
type Guard = <T>(
  path: string | undefined,
  apply: () => Promise<T>,
) => Promise<T>;
const writers = new WeakMap<App, { guard: Guard }>();
/** Optional AI writer admission augments replacement, not ordinary App teardown. */
export function bindTranscriptWriters(app: App, guard: Guard): () => void {
  if (writers.has(app)) throw new Error("Transcript writers are already bound");
  const lease = { guard };
  writers.set(app, lease);
  return () => {
    if (writers.get(app) === lease) writers.delete(app);
  };
}
export function guardTranscriptReplacement<T>(
  app: App,
  path: string | undefined,
  apply: () => Promise<T>,
): Promise<T> {
  const guard = writers.get(app)?.guard;
  return guard
    ? guard(path, apply)
    : app.fileEditingSessions.guard(path, apply);
}
