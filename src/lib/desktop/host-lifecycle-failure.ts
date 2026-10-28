import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";

const resource = {
  uri: "desktop:host-lifecycle",
  label: "Desktop",
  icon: "circle-alert",
} as const;

/** Publish ready-session host failures into Problems and a transient toast. */
export function bindHostLifecycleFailure(app: App): {
  publish(message: string): void;
  clear(): void;
  dispose(): void;
} {
  const collection = app.workspace.diagnostics.createCollection(
    "desktop:host-lifecycle",
    { label: "Desktop" },
  );
  let published = "";
  let active = true;
  return {
    publish(message: string) {
      if (!active || !message || message === published) return;
      published = message;
      collection.set(resource, [
        {
          message,
          severity: "error",
          source: "Desktop",
          code: "host-lifecycle",
        },
      ]);
      app.notifications.notify({
        severity: "error",
        source: "desktop",
        message,
      });
      const { controller } = getWorkspaceHostBinding(app.workspace);
      void controller
        .start()
        .then(async () => {
          if (active && published === message)
            await controller.commands.execute("app-shell:show-problems");
        })
        .catch((error) => {
          if (active)
            app.notifications.notify({
              severity: "error",
              source: "desktop",
              message: error instanceof Error ? error.message : String(error),
            });
        });
    },
    clear() {
      if (!active || !published) return;
      published = "";
      collection.delete(resource);
    },
    dispose() {
      if (!active) return;
      active = false;
      published = "";
      collection.dispose();
    },
  };
}
