// SPDX-License-Identifier: Apache-2.0
import { untrack } from "svelte";
import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatPanelProps } from "./props.ts";

/** Keep recoverable UI failures visible without claiming an acknowledged reply. */
export function runChatAction(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
  operation: () => unknown | Promise<unknown>,
): Promise<void> {
  const pending = performChatAction(getProps, controller, operation);
  untrack(() => getProps().onOperation?.(pending));
  return pending;
}
async function performChatAction(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
  operation: () => unknown | Promise<unknown>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    controller.error = message;
    getProps().app?.notifications.notify({
      id: "ai-action-error",
      title: "AI",
      source: "ai",
      severity: "error",
      message,
    });
  }
}
