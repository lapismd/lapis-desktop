// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";
import AiCatalogPanel from "../../../../src/components/ai/catalog/AiCatalogPanel.svelte";
import AiWorkspaceDemo from "../../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
import { expectAiPlacement } from "../../../support/ai/workspace/placement-assertions.ts";
import {
  aiPlacementParameters,
  AI_PLACEMENTS,
  expectAiExample,
} from "../../../support/ai/workspace/examples.ts";
import type { AiPanelLayout } from "../../../support/ai/workspace/layout.ts";
import { catalogAssertions } from "../../../support/ai/catalog-assertions.ts";
import { aiWorkspaceFixture } from "../../../support/ai/workspace/fixture.ts";
import { AiPlugin } from "../../../../src/components/ai/plugin/ai-plugin.ts";
const kind = "ai-catalog" as const;
const meta = {
  title: "Desktop/AI/Panels/Catalog",
  component: AiCatalogPanel,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AiCatalogPanel>;
export default meta;
type Story = StoryObj<typeof AiWorkspaceDemo>;
function placement(layout: AiPanelLayout): Story {
  return {
    name: AI_PLACEMENTS[layout],
    parameters: aiPlacementParameters(kind, layout),
    render: () => ({
      Component: AiWorkspaceDemo,
      props: { kind, layout },
    }),
    play: async ({ args, canvasElement, parameters }) => {
      const panel = await expectAiPlacement(
        canvasElement,
        kind,
        layout,
        "ai-catalog",
        args,
      );
      const fixture = aiWorkspaceFixture(canvasElement);
      const plugin = fixture.plugin();
      expect(plugin).toBeInstanceOf(AiPlugin);
      if (!plugin) throw new Error("Missing production AI plugin");
      await catalogAssertions(canvasElement, panel, async () => ({
        settings: plugin.getSettings(),
        opened: fixture.app.workspace.getActiveFile()?.path,
      }));
      expectAiExample(parameters, kind, layout);
    },
  };
}
export const MiddleTopTabs = placement("middle-top-tabs");
export const StackedTabs = placement("stacked-tabs");
export const LeftSidebar = placement("left-sidebar");
export const RightSidebar = placement("right-sidebar");
export const BottomPanel = placement("bottom-panel");
export const SidebarGroup = placement("sidebar-group");
