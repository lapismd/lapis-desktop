// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PendingPanelDemo from "../../support/ai/workspace/PendingPanelDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Panel lifetime",
  component: PendingPanelDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof PendingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
function pendingPanel(kind: "history" | "catalog" | "chat"): Story {
  return {
    args: { kind },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const state = () =>
        JSON.parse(
          canvas.getByLabelText("Pending panel lifetime").textContent ?? "{}",
        );
      await waitFor(() => expect(state().started).toBe(true));
      if (kind === "chat") expect(state().operations).toBeGreaterThan(0);
      await userEvent.click(
        canvas.getByRole("button", { name: "Close panel and database" }),
      );
      try {
        await waitFor(() => expect(state().disposalObserved).toBe(true));
        expect(state().databaseClosed).toBe(false);
      } finally {
        await userEvent.click(
          canvas.getByRole("button", { name: "Release pending read" }),
        );
      }
      await waitFor(() => {
        expect(state()).toMatchObject({
          readFinished: true,
          databaseClosed: true,
          failure: "",
        });
      });
    },
  };
}
export const HistoryPendingRead = pendingPanel("history");
export const CatalogPendingRead = pendingPanel("catalog");
export const ChatPendingRestore = pendingPanel("chat");
