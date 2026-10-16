import { Notice, type App } from "@lapis-notes/api";
import type { DesktopUrlDelivery } from "../native/integration-urls.ts";

/** Admit navigation and its native acknowledgement before host teardown. */
export function attachNotesUrls(
  app: App,
  delivery: DesktopUrlDelivery,
): () => void {
  return delivery.attach((request, acknowledge) =>
    app.fileEditingSessions.track(async () => {
      if (request.error) new Notice(request.error, undefined, app);
      else if (!request.url || !(await app.urls.dispatch(request.url)))
        new Notice(
          "This link could not be opened in the current vault.",
          undefined,
          app,
        );
      await acknowledge();
    }),
  );
}
