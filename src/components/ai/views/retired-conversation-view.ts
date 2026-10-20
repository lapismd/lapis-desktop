// SPDX-License-Identifier: Apache-2.0
import { View, type App, type WorkspaceLeaf } from "@lapis-notes/api";
import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
import { AI_HISTORY_VIEW } from "../../../lib/ai/plugin/view-types.ts";
const notified = new WeakSet<App>();
export function notifyRetiredConversations(app: App): void {
  if (notified.has(app)) return;
  notified.add(app);
  app.notifications.notify({
    id: "ai-native-history-retired",
    source: "ai",
    severity: "info",
    title: "Conversation history",
    message:
      "Native JJ conversations are preserved in the checkpoint build. Local ACP history is available here.",
  });
}
export function redirectRetiredConversation(
  leaf: WorkspaceLeaf,
  host: AiApplication,
): void {
  notifyRetiredConversations(host.app);
  void host.operations
    .track(
      Promise.resolve().then(async () => {
        if (!host.active) return;
        await leaf.setViewState({ type: AI_HISTORY_VIEW, state: {} });
        host.app.workspace.requestSaveLayout();
      }),
    )
    .catch((error) => host.report(error));
}
/** Restore-only alias. No native ID, backend, journal or receipt is opened. */
export class RetiredConversationView extends View {
  constructor(
    leaf: WorkspaceLeaf,
    private host: AiApplication,
  ) {
    super(leaf);
  }
  getViewType() {
    return "ai-native-conversation-history";
  }
  getDisplayText() {
    return "AI conversations";
  }
  protected async onOpen(): Promise<void> {}
  protected async onClose(): Promise<void> {}
  onload(): void {
    redirectRetiredConversation(this.leaf, this.host);
  }
}
