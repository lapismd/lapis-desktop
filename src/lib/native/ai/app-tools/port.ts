import { listen } from "@tauri-apps/api/event";
import type { NativeCall } from "../../vault-client.ts";
import type { BackgroundWork } from "../../../desktop/background-work.ts";
import type { NativeToolEvent, ToolPort } from "./types.ts";

export type ToolListen = (
  receive: (event: NativeToolEvent) => void,
) => Promise<() => void>;
export const nativeToolListen: ToolListen = (receive) =>
  listen<NativeToolEvent>("desktop-ai-tools", (event) =>
    receive(event.payload),
  );
export function createToolPort(
  sessionId: string,
  native: NativeCall,
  prepare: () => Promise<void>,
  work: BackgroundWork,
  report: (error: Error) => void,
  subscribe: ToolListen = nativeToolListen,
): ToolPort {
  return {
    prepare,
    report,
    listen: subscribe,
    work: (title, task) => work.run(title, task),
    request: (requestId, operation) =>
      native("desktop_ai_tools", {
        request: JSON.stringify({ sessionId, requestId, operation }),
      }),
  };
}
