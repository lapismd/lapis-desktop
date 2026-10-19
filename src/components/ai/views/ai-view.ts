// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AiView identity and in-place assignment policy; see lib/ai/NOTICE.md.
import { mount } from "svelte";
import type { ViewStateResult } from "@lapis-notes/api";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiViewPanel from "./AiViewPanel.svelte";
import type { ConversationLocation } from "../../../lib/ai/conversations/types.ts";
import { AI_VIEW } from "../../../lib/ai/plugin/view-types.ts";
import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
import AiChatSession from "../sessions/AiChatSession.svelte";
function location(state: Record<string, unknown>): ConversationLocation | null {
  return typeof state.scopeDir === "string" &&
    typeof state.conversationId === "string"
    ? { scopeDir: state.scopeDir, conversationId: state.conversationId }
    : null;
}
export class AiView extends OwnedAiPanelView {
  protected transcriptFrame: AiChatPanelProps["transcriptFrame"] =
    AiChatSession;
  getViewType() {
    return AI_VIEW;
  }
  getDisplayText() {
    return "AI";
  }
  getIcon() {
    return "sparkles";
  }
  getBreadcrumbFilePath(): string | null {
    return (
      location(this.getState())
        ?.scopeDir.replace(/^\/+|\/+$/gu, "")
        .trim() || null
    );
  }
  getBreadcrumbs() {
    return [
      {
        id: "ai",
        label: "AI",
        onSelect: () => {
          void this.host
            .revealConversationHistory()
            .catch((error) => this.host.report(error));
        },
      },
    ];
  }
  async setState(
    state: Record<string, unknown>,
    result?: ViewStateResult,
  ): Promise<void> {
    const previous = location(this.getState());
    await super.setState(state, result);
    const next = location(state);
    if (!this.hasPanel) return;
    if (
      previous?.scopeDir === next?.scopeDir &&
      previous?.conversationId === next?.conversationId
    )
      return;
    await this.refreshPanel();
  }
  protected mountPanel() {
    return mount(AiViewPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        host: this.host,
        transcriptFrame: this.transcriptFrame,
        workspaceLeaf: this.leaf,
        initialLocation: location(this.getState()),
        onConversationLocationChange: (next) => {
          const state = { ...this.getState() };
          if (next) {
            state.scopeDir = next.scopeDir;
            state.conversationId = next.conversationId;
          } else {
            delete state.scopeDir;
            delete state.conversationId;
          }
          void this.host.operations
            .track(super.setState(state))
            .catch((error) => this.host.report(error));
        },
      },
    });
  }
}
