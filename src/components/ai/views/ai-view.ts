// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AiView identity and in-place assignment policy; see lib/ai/NOTICE.md.
import { mount } from "svelte";
import type { ViewStateResult } from "@lapis-notes/api";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiViewPanel from "./AiViewPanel.svelte";
import {
  conversationRouteFromState,
  sameConversationRoute,
  stateWithConversationRoute,
  type ConversationRoute,
} from "../../../lib/ai/conversations/conversation-route.ts";
import {
  AI_VIEW,
  AI_HISTORY_VIEW,
  AI_NATIVE_HISTORY_VIEW,
} from "../../../lib/ai/plugin/view-types.ts";
import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
import AiChatSession from "../sessions/AiChatSession.svelte";
import NativeConversationPanel from "./NativeConversationPanel.svelte";
export class AiView extends OwnedAiPanelView {
  #routeEpoch = 0;
  protected nativeCatalog = false;
  protected transcriptFrame: AiChatPanelProps["transcriptFrame"] =
    AiChatSession;
  getViewType() {
    return AI_VIEW;
  }
  getDisplayText(): string {
    return conversationRouteFromState(this.getState())?.backend === "jj"
      ? "Native conversation"
      : "AI";
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
          const native =
            this.nativeCatalog ||
            conversationRouteFromState(this.getState())?.backend === "jj";
          void this.host
            .revealPanel(
              native ? AI_NATIVE_HISTORY_VIEW : AI_HISTORY_VIEW,
              "right",
            )
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
    if (this.nativeCatalog && next && next.backend !== "jj")
      throw new Error("Native history cannot open a file conversation route");
    if (!sameConversationRoute(previous, next)) this.#routeEpoch++;
    await super.setState(stateWithConversationRoute(state, next), result);
    if (!this.hasPanel) return;
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
    if (route?.backend === "jj" || this.nativeCatalog)
      return mount(NativeConversationPanel, {
        target: this.containerEl,
        props: {
          app: this.app,
          host: this.host,
          initialConversation:
            route?.backend === "jj" ? route.conversation : undefined,
          chatEnabled: !this.nativeCatalog,
          onConversationChange: (conversation) =>
            this.rememberConversation(
              {
                version: 1,
                backend: "jj",
                conversation,
              },
              epoch,
            ),
        },
      });
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
