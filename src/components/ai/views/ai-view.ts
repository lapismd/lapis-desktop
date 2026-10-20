// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AiView identity and in-place assignment policy; see lib/ai/NOTICE.md.
import { redirectRetiredConversation } from "./retired-conversation-view.ts";
import { mount } from "svelte";
import type { ViewStateResult } from "@lapis-notes/api";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiViewPanel from "./AiViewPanel.svelte";
import {
  conversationRouteFromState,
  retiredNativeRoute,
  sameConversationRoute,
  stateWithConversationRoute,
  type ConversationRoute,
} from "../../../lib/ai/conversations/conversation-route.ts";
import { AI_VIEW, AI_HISTORY_VIEW } from "../../../lib/ai/plugin/view-types.ts";
import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
import AiChatSession from "../sessions/AiChatSession.svelte";
export class AiView extends OwnedAiPanelView {
  #routeEpoch = 0;
  #retired = false;
  onload(): void {
    if (this.#retired) redirectRetiredConversation(this.leaf, this.host);
    else super.onload();
  }
  protected transcriptFrame: AiChatPanelProps["transcriptFrame"] =
    AiChatSession;
  getViewType() {
    return AI_VIEW;
  }
  getDisplayText(): string {
    return "AI";
  }
  getIcon() {
    return "sparkles";
  }
  getBreadcrumbFilePath(): string | null {
    const route = conversationRouteFromState(this.getState());
    return route?.backend === "vault-files"
      ? route.location.scopeDir.replace(/^\/+|\/+$/gu, "").trim() || null
      : null;
  }
  getBreadcrumbs() {
    return [
      {
        id: "ai",
        label: "AI",
        onSelect: () => {
          void this.host
            .revealPanel(AI_HISTORY_VIEW, "right")
            .catch((error) => this.host.report(error));
        },
      },
    ];
  }
  async setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = conversationRouteFromState(this.getState());
    const next = conversationRouteFromState(state);
    this.#retired = retiredNativeRoute(state);
    if (!sameConversationRoute(previous, next)) this.#routeEpoch++;
    await super.setState(stateWithConversationRoute(state, next), result);
    if (!this.hasPanel) return;
    if (this.#retired) {
      redirectRetiredConversation(this.leaf, this.host);
      return;
    }
    if (sameConversationRoute(previous, next)) return;
    await this.refreshPanel();
  }
  private rememberConversation(route: ConversationRoute | null, epoch: number) {
    if (epoch !== this.#routeEpoch || !this.host.active) return;
    if (
      sameConversationRoute(conversationRouteFromState(this.getState()), route)
    )
      return;
    const state = stateWithConversationRoute(this.getState(), route);
    void this.host.operations
      .track(
        super.setState(state).then(() => {
          if (epoch === this.#routeEpoch && this.host.active)
            this.app.workspace.requestSaveLayout();
        }),
      )
      .catch((error) => this.host.report(error));
  }
  protected mountPanel() {
    const epoch = this.#routeEpoch;
    const route = conversationRouteFromState(this.getState());
    return mount(AiViewPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        host: this.host,
        transcriptFrame: this.transcriptFrame,
        workspaceLeaf: this.leaf,
        initialLocation:
          route?.backend === "vault-files" ? route.location : null,
        onConversationLocationChange: (next) => {
          this.rememberConversation(
            next
              ? { version: 1, backend: "vault-files", location: next }
              : null,
            epoch,
          );
        },
      },
    });
  }
}
