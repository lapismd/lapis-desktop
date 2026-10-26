import type { App } from "@lapis-notes/api";
import type { DesktopPopouts } from "../desktop/workspace-popouts.ts";
import { leaveWithStoppedWatching } from "./notes-leave.ts";

type NotesDisposeOptions = {
  popouts?: DesktopPopouts;
  prepareLeave(): void | Promise<void>;
  resumeLeave?(): void | Promise<void>;
  beforeDispose(): void | Promise<void>;
  stopMetadataTracking?(): void;
  disposeSync(): void | Promise<void>;
  disposeSettings(): void;
  disposeBrowser(): void;
  complete(): void;
  canResume(): boolean;
};

/** Keep writers and every related document under the same App leave guard. */
export function disposeNotesWorkspace(
  app: App,
  options: NotesDisposeOptions,
): Promise<void> {
  return leaveWithStoppedWatching(
    app,
    async () => {
      await app.workspace.flushPluginChanges();
      await app.plugins.flushPendingConfigWrites();
      await app.fileEditingSessions.settleOperations();
      await app.fileEditingSessions.preflightNativeRecovery();
      await app.fileEditingSessions.guard(undefined, async () => {
        await app.workspace.flushLayout();
        try {
          await options.prepareLeave();
        } catch (failure) {
          try {
            await options.resumeLeave?.();
          } catch (resume) {
            throw new AggregateError(
              [failure, resume],
              "Final persistence failed and backup watching could not resume",
            );
          }
          throw failure;
        }
        // Projection and layout saves still need their mounted view state.
        await app.workspace.disposeWorkspaceHost();
        // Join shell cleanup before retiring the resources its views use.
        await options.beforeDispose();
        await options.popouts?.dispose();
        options.stopMetadataTracking?.();
        await app.metadataCache.dispose();
        for (const plugin of [...app.plugins.plugins.values()].reverse())
          await plugin.disable();
        await options.disposeSync();
        options.disposeSettings();
        options.disposeBrowser();
        options.complete();
      });
    },
    options.canResume,
  );
}
