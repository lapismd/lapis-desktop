const cleanups = new Set<() => Promise<void>>();

export function registerCatalogCleanup(dispose: () => Promise<void>) {
  cleanups.add(dispose);
  return () => cleanups.delete(dispose);
}

/** Storybook awaits owned App teardown before starting the next example. */
export async function cleanupCatalog(): Promise<void> {
  const pending = [...cleanups];
  cleanups.clear();
  for (const dispose of pending) await dispose();
}
