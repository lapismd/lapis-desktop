import type { App } from "@lapis-notes/api";
import { nativeTaskDailyFormat } from "@lapis-notes/api/native-tasks";
import { observeTaskTransport } from "./tasks-transport.ts";

/** Compile only through plugin-entry.ts in the debug e2e renderer. */
export function installTasksAcceptance(application: () => App): void {
  const target = Reflect.get(window, "__TAURI_INTERNALS__");
  if (!target?.invoke)
    throw new Error("Native Task acceptance requires Tauri IPC");
  const transport = observeTaskTransport(target);
  let provider: { dispose(): void } | undefined;
  let callbacks = 0;
  const disposeProvider = () => {
    provider?.dispose();
    provider = undefined;
  };
  Object.assign(globalThis, {
    __lapisTasksAcceptance: {
      ...transport,
      status: () => {
        const tasks = application().nativeTasks;
        if (!tasks) throw new Error("No public native Task session");
        return tasks.call({ kind: "status" });
      },
      references: () =>
        application().appDatabase.getMeta(
          "plugin:tasks:native-request-references:v1",
        ),
      context() {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        return {
          format: nativeTaskDailyFormat(),
          today,
          intl: Intl.DateTimeFormat().resolvedOptions(),
        };
      },
      customProvider(enabled: boolean) {
        disposeProvider();
        if (enabled) {
          callbacks = 0;
          const refuse = async (): Promise<never> => {
            callbacks++;
            throw new Error("Unsupported renderer provider callback executed");
          };
          provider = application().dailyDocumentProviders.register({
            id: "native-acceptance:custom",
            priority: 100,
            locate: refuse,
            ensure: refuse,
          });
        }
      },
      providerCallbacks: () => callbacks,
      cleanup() {
        disposeProvider();
        transport.dispose();
      },
    },
  });
}
