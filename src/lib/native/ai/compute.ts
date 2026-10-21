import type { App } from "@lapis-notes/api";
import {
  AiCompute,
  type ComputeStatus,
} from "../../ai/settings/compute.svelte.ts";
import type { NativeCall } from "../vault-client.ts";
import type { BackgroundWork } from "../../desktop/background-work.ts";
export function nativeCompute(
  app: App,
  sessionId: string,
  call: NativeCall,
  background: BackgroundWork,
  prepare: () => Promise<unknown>,
  changed: () => void,
  allowed: () => boolean,
) {
  return new AiCompute(
    async (action) => {
      if (action.type === "status" || action.command.action.type !== "stop") {
        if (!allowed()) throw new Error("Compute requires a trusted workspace");
        await prepare();
      }
      return call<ComputeStatus>("desktop_ai_compute", {
        request: { sessionId, action },
      });
    },
    (title, action) => background.run(title, action),
    changed,
    (error) =>
      app.notifications.notify({
        id: "ai-compute",
        title: "Optional compute",
        source: "ai",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      }),
    async () => {
      if (!allowed()) throw new Error("Compute requires a trusted workspace");
      await prepare();
      return call<string | null>("desktop_ai_compute_pick_file", { sessionId });
    },
  );
}
