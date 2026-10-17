// SPDX-License-Identifier: Apache-2.0
import { mount } from "svelte";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiHistoryPanel from "../history/AiHistoryPanel.svelte";
import { AI_HISTORY_VIEW } from "../../../lib/ai/plugin/view-types.ts";
export class AiHistoryView extends OwnedAiPanelView {
  getViewType() {
    return AI_HISTORY_VIEW;
  }
  getDisplayText() {
    return "AI conversations";
  }
  getIcon() {
    return "history";
  }
  protected mountPanel() {
    return mount(AiHistoryPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        onDispose: (pending) => {
          this.host.operations.track(pending);
        },
        repository: this.host.conversations,
        getScope: () => this.host.currentConversationScope(),
        getActiveConversation: () => this.host.currentAiConversation(),
        onOpenConversation: (location) =>
          this.host.openAiConversation(location),
        onNewConversation: (scope) => this.host.createAiConversation(scope),
        listConversationFolders: () => this.host.listConversationFolders(),
        searchAllConversations: (query) =>
          this.host.searchAiConversations(query),
      },
    });
  }
}
