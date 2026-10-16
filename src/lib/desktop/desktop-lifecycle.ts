import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type LeaveRequest = { requestId: string; action: "close" | "reload" };

export function requestReload(): Promise<void> {
  return invoke("lifecycle_reload");
}

/** Install before shell_ready so native close cannot outrun the listener. */
export async function installDesktopLifecycle(
  prepare: (action: "close" | "reload") => Promise<void>,
  report: (failure: unknown) => void,
): Promise<() => void> {
  let pending: Promise<void> | undefined;
  const stop = await listen<LeaveRequest>(
    "lapis-lifecycle-request",
    ({ payload }) => {
      if (pending) return;
      pending = (async () => {
        let saved = false;
        try {
          await prepare(payload.action);
          saved = true;
        } catch (failure) {
          report(failure);
        }
        await invoke("lifecycle_result", {
          requestId: payload.requestId,
          saved,
        });
      })()
        .catch(report)
        .finally(() => {
          pending = undefined;
        });
    },
  );
  const reloadKey = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) void requestReload().catch(report);
    }
  };
  addEventListener("keydown", reloadKey, { capture: true });
  return () => {
    stop();
    removeEventListener("keydown", reloadKey, { capture: true });
  };
}
