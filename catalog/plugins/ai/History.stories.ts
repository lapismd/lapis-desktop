// SPDX-License-Identifier: Apache-2.0
import { aiReviewAction } from "../../support/ai/review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../support/ai/PanelDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyAssertions } from "../../support/ai/history-assertions.ts";
import {
  readyPanel,
  inspectPanel,
} from "../../support/ai/panel-interactions.ts";
import { clickHarnessControl } from "../../support/ai/menu-interactions.ts";
const meta = {
  title: "Desktop/AI/History",
  component: PanelDemo,
  args: { kind: "history" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof PanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RetainedTree: Story = {
  play: ({ canvasElement }) => historyAssertions(canvasElement),
};
export const CreationFailureAndRetry: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-conversation-history");
    const canvas = within(canvasElement);
    await aiReviewAction(canvasElement, "Fail next panel action");
    await userEvent.click(
      panel.getByRole("button", { name: "New chat in Notes" }),
    );
    expect(
      await within(canvasElement.ownerDocument.body).findByRole("alert"),
    ).toHaveTextContent("Fixture panel action failed");
    expect(
      panel.getByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
    ).toBeVisible();
    expect((await inspectPanel(canvasElement)).notifications).toContain(
      "Fixture panel action failed",
    );
    await userEvent.click(
      panel.getByRole("button", { name: "New chat in Notes" }),
    );
    expect(
      await panel.findByRole("button", {
        name: /^Untitled conversation(?:\s|$)/,
      }),
    ).toBeVisible();
    expect((await inspectPanel(canvasElement)).created).toBe("Notes");
    expect(panel.queryByRole("alert")).toBeNull();
    await waitFor(
      () =>
        expect(
          within(canvasElement.ownerDocument.body).queryByRole("alert"),
        ).toBeNull(),
      { timeout: 12_000 },
    );
  },
};
export const ArchiveRestoreDelete: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-conversation-history");
    const body = within(canvasElement.ownerDocument.body);
    async function action(label: string) {
      await userEvent.click(
        panel.getByRole("button", {
          name: "Conversation actions for Summarize project notes",
        }),
      );
      await clickHarnessControl(
        await body.findByRole("menuitem", { name: label }),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none"),
      );
    }
    await action("Archive");
    await waitFor(() =>
      expect(
        panel.queryByRole("button", {
          name: /^Summarize project notes(?:\s|$)/,
        }),
      ).toBeNull(),
    );
    await userEvent.click(
      panel.getByRole("button", { name: "Show conversation options" }),
    );
    await userEvent.click(
      panel.getByRole("switch", { name: "Show archived conversations" }),
    );
    expect(
      await panel.findByRole("button", {
        name: /^Summarize project notes(?:\s|$)/,
      }),
    ).toBeVisible();
    await action("Restore");
    await waitFor(() =>
      expect(
        panel.getByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
      ).not.toHaveTextContent("Archived"),
    );
    expect(panel.getByText("Archived planning chat")).toBeVisible();
    await action("Delete");
    await waitFor(() =>
      expect(
        panel.queryByRole("button", {
          name: /^Summarize project notes(?:\s|$)/,
        }),
      ).toBeNull(),
    );
    await userEvent.click(
      panel.getByRole("switch", { name: "Show archived conversations" }),
    );
    expect(
      panel.queryByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
    ).toBeNull();
  },
};
export const StaleSearchAndUnmount: Story = {
  play: async ({ canvasElement }) => {
    const panel = await readyPanel(canvasElement, "ai-conversation-history");
    const canvas = within(canvasElement);
    await aiReviewAction(canvasElement, "Hold next panel refresh");
    await userEvent.type(
      panel.getByRole("searchbox", { name: "Search conversations" }),
      "parser",
    );
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(true),
    );
    await userEvent.click(panel.getByRole("button", { name: "Clear search" }));
    expect(
      await panel.findByRole("button", {
        name: /^Summarize project notes(?:\s|$)/,
      }),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Release held panel refresh");
    await waitFor(async () =>
      expect((await inspectPanel(canvasElement)).pending).toBe(false),
    );
    expect(
      panel.getByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "Unmount panel");
    expect(canvas.queryByTestId("ai-conversation-history")).toBeNull();
  },
};
