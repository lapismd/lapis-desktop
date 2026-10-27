import { MarkdownView, Plugin, type App } from "@lapis-notes/api";
import { installTasksAcceptance } from "./tasks-entry.ts";
import { installDistributionAcceptance } from "./distribution-entry.ts";
import { installWorkspacePopupAcceptance } from "./popout-session.ts";

/** Passive ownership/worker observation confined to the compiled e2e entry. */
export function installPluginAcceptance(): ReturnType<
  typeof installTasksAcceptance
> {
  let current: WeakRef<App> | undefined;
  const enable = Plugin.prototype.enable;
  Plugin.prototype.enable = async function () {
    current = new WeakRef(this.app);
    return enable.call(this);
  };
  const workers = new Map<Worker, string>();
  const resources = new Map<
    string,
    { url: string; status: number; mime: string | null; error?: string }
  >();
  let created = 0;
  let terminated = 0;
  window.Worker = new Proxy(window.Worker, {
    construct(target, args) {
      const url = String(args[0]);
      if (url.startsWith("blob:")) {
        const receipt = { url, status: 0, mime: null as string | null };
        resources.set(url, receipt);
        // Harper revokes its Blob URL inside the worker. Observe its MIME
        // before construction rather than fetching an intentionally retired URL.
        void fetch(url)
          .then((response) => {
            receipt.status = response.status;
            receipt.mime = response.headers.get("Content-Type");
            return response.body?.cancel();
          })
          .catch((error) => Object.assign(receipt, { error: String(error) }));
      }
      const worker: Worker = Reflect.construct(target, args);
      workers.set(worker, String(args[0]));
      created++;
      const terminate = worker.terminate.bind(worker);
      worker.terminate = () => {
        if (workers.delete(worker)) terminated++;
        terminate();
      };
      return worker;
    },
  });
  function application(): App {
    const owned = current?.deref();
    if (!owned) throw new Error("No live plugin-owned acceptance App");
    return owned;
  }
  const call = installTasksAcceptance(application);
  installDistributionAcceptance(application);
  installWorkspacePopupAcceptance(application);
  Object.assign(globalThis, {
    __lapisPluginAcceptance: {
      async open(path: string) {
        await application().workspace.openLinkText(path, "", false);
      },
      fileText(path: string) {
        for (const leaf of application().workspace.getLeavesOfType("markdown"))
          if (
            leaf.view instanceof MarkdownView &&
            leaf.view.file?.path === path
          )
            return leaf.view.editor.getValue();
        return null;
      },
      async run(id: string) {
        const result = await application().commands.executeCommand(id);
        return typeof result === "boolean" || typeof result === "string"
          ? result
          : null;
      },
      async enabled(id: string, enabled: boolean) {
        return enabled
          ? application().plugins.enablePlugin(id)
          : application().plugins.disablePlugin(id);
      },
      state(id: string) {
        return {
          enabled: application().plugins.isPluginEnabled(id),
          diagnostics: application().plugins.getCommunityPluginDiagnostics(id),
        };
      },
      workers() {
        return {
          active: [...workers.values()],
          resources: [...resources.values()],
          created,
          terminated,
        };
      },
    },
  });
  return call;
}
