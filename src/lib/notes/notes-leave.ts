import type { App } from "@lapis-notes/api";

/** Stop ingestion before leaving and reconcile again when the live App stays. */
export async function leaveWithStoppedWatching(
  app: Pick<App, "vaultChanges">,
  leave: () => Promise<void>,
  canResume: () => boolean,
): Promise<void> {
  try {
    await app.vaultChanges.stop();
    await leave();
  } catch (failure) {
    if (canResume()) {
      try {
        await app.vaultChanges.start();
      } catch (resume) {
        throw new AggregateError(
          [failure, resume],
          "Leaving failed and file watching could not resume",
        );
      }
    }
    throw failure;
  }
}
