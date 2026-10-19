// SPDX-License-Identifier: Apache-2.0
import { mount } from "svelte";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiImportPanel from "../imports/AiImportPanel.svelte";
import { AI_IMPORT_VIEW } from "../../../lib/ai/plugin/view-types.ts";
export class AiImportView extends OwnedAiPanelView {
  getViewType() {
    return AI_IMPORT_VIEW;
  }
  getDisplayText() {
    return "Import AI sessions";
  }
  getIcon() {
    return "download";
  }
  protected mountPanel() {
    return mount(AiImportPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        repository: this.host.conversations,
        sources: this.host.services.importSources,
        scopeDir: this.host.currentConversationScope(),
        onOpen: (location) => this.host.openAiConversation(location),
        onDispose: (pending) => {
          this.host.operations.track(pending);
        },
      },
    });
  }
}
