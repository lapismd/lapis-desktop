// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect } from "storybook/test";
import AiHistoryPanel from "../../../../src/components/ai/history/AiHistoryPanel.svelte";
import AiWorkspaceDemo from "../../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
import { expectAiPlacement } from "../../../support/ai/workspace/placement-assertions.ts";
import {
  aiPlacementParameters,
  AI_PLACEMENTS,
  expectAiExample,
} from "../../../support/ai/workspace/examples.ts";
import type { AiPanelLayout } from "../../../support/ai/workspace/layout.ts";
import { historyAssertions } from "../../../support/ai/history-assertions.ts";
const kind = "ai-history" as const;
const meta = {
  title: "Desktop/AI/Panels/History",
  component: AiHistoryPanel,
  tags: ["visual-pending", "autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AiHistoryPanel>;
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
        "ai-conversation-history",
        args,
      );
      await historyAssertions(canvasElement, panel);
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
