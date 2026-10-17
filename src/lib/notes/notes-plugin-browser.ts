import { Notice, type App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { openPluginBrowser, PluginsView } from "@lapis-notes/workspace";

/** Desktop navigation composes the retained public Workspace presentation. */
export function registerDesktopPluginBrowser(app: App): () => void {
  app.workspace.registerView("plugins", (leaf) => new PluginsView(leaf));
  let disposed = false;
  let opening: Promise<void> | undefined;
  const open = () => {
    if (disposed) return Promise.resolve();
    opening ??= openPluginBrowser(app, undefined, () => !disposed).finally(
      () => {
        opening = undefined;
      },
    );
    return opening;
  };
  const navigate = () => {
    void open().catch((failure) => {
      if (!disposed)
        new Notice(
          failure instanceof Error ? failure.message : String(failure),
          undefined,
          app,
        );
    });
  };
  const removeProtocol = app.urls.registerProtocolHandler(
    "plugins",
    async ({ id, version }) => {
      if (disposed || !/^[a-z0-9][a-z0-9-]{0,62}$/u.test(id ?? "")) return;
      if (
        version !== undefined &&
        !/^[A-Za-z0-9][A-Za-z0-9.+-]{0,127}$/u.test(version)
      )
        return;
      await openPluginBrowser(app, id, () => !disposed, version);
      if (!disposed)
        getWorkspaceHostBinding(app.workspace).controller.settings.close();
    },
  );
  const removeRibbon = app.workspace.leftRibbon.addItem({
    id: "app:plugins",
    title: "Plugins",
    icon: "package",
    hidden: false,
    callback: navigate,
  });
  app.commands.registerCommand({
    id: "app:open-plugins",
    name: "Open Plugins",
    icon: "package",
    callback: open,
  });
  return () => {
    if (disposed) return;
    disposed = true;
    removeProtocol();
    removeRibbon();
    app.commands.unregisterCommand("app:open-plugins");
    for (const leaf of app.workspace.getLeavesOfType("plugins"))
      if (leaf.view instanceof PluginsView) leaf.view.unload();
    app.workspace.unregisterView("plugins");
  };
}
