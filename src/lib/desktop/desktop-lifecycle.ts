import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type LeaveRequest = { requestId: string; action: "close" | "reload" };

type DesktopLifecycleBindings = {
  invoke: typeof invoke;
  listen: typeof listen;
  target: Pick<typeof globalThis, "addEventListener" | "removeEventListener">;
};

export function requestReload(): Promise<void> {
  return invoke("lifecycle_reload");
}

/** Install before shell_ready so native close cannot outrun the listener. */
export async function installDesktopLifecycle(
  prepare: (action: "close" | "reload") => Promise<void>,
  report: (failure: unknown) => void,
  bindings: DesktopLifecycleBindings = {
    invoke,
    listen,
    target: globalThis,
  },
): Promise<() => void> {
  let pending: Promise<void> | undefined;
  let queuedReload = false;
  let active = true;
  const requestReloadWhenReady = () => {
    if (pending) {
      queuedReload = true;
      return;
    }
    void bindings.invoke("lifecycle_reload").catch(report);
  };
  const stop = await bindings.listen<LeaveRequest>(
    "lapis-lifecycle-request",
    ({ payload }) => {
      if (pending) return;
      let saved = false;
      let acknowledged = false;
      pending = (async () => {
        try {
          await prepare(payload.action);
          saved = true;
        } catch (failure) {
          report(failure);
        }
        await bindings.invoke("lifecycle_result", {
          requestId: payload.requestId,
          saved,
        });
        acknowledged = true;
      })()
        .catch(report)
        .finally(() => {
          pending = undefined;
          const retry = active && acknowledged && !saved && queuedReload;
          queuedReload = false;
          if (retry) requestReloadWhenReady();
        });
    },
  );
  const reloadKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) requestReloadWhenReady();
    }
  };
  bindings.target.addEventListener("keydown", reloadKey, { capture: true });
  return () => {
    active = false;
    queuedReload = false;
    stop();
    bindings.target.removeEventListener("keydown", reloadKey, {
      capture: true,
    });
  };
}
