// SPDX-License-Identifier: Apache-2.0
import { mount } from "svelte";
import { OwnedAiPanelView } from "./owned-panel-view.ts";
import AiCatalogPanel from "../catalog/AiCatalogPanel.svelte";
import { AI_CATALOG_VIEW } from "../../../lib/ai/plugin/view-types.ts";
export class AiCatalogView extends OwnedAiPanelView {
  getViewType() {
    return AI_CATALOG_VIEW;
  }
  getDisplayText() {
    return "Catalog";
  }
  getIcon() {
    return "library";
  }
  protected mountPanel() {
    return mount(AiCatalogPanel, {
      target: this.containerEl,
      props: {
        app: this.app,
        onDispose: (pending) => {
          this.host.operations.track(pending);
        },
        loadCatalog: () => this.host.loadAiCatalog(),
        onToggleTool: (tool, enabled) =>
          this.host.setCatalogToolEnabled(tool, enabled),
        onOpenSkill: (path) => this.host.openCatalogSkill(path),
        subscribeSettings: (listener) =>
          this.host.subscribeSettings(() => listener()),
        subscribeUserCommands: (listener) =>
          this.host.userAgents?.subscribe?.(listener) ?? (() => {}),
      },
    });
  }
}
