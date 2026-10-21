import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ChangeHistoryDemo from "../../support/ai/history/ChangeHistoryDemo.svelte";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Change history",
  component: ChangeHistoryDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ChangeHistoryDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function send(element: HTMLElement) {
  await aiReviewAction(element, "ready");
  const canvas = within(element);
  const editor = await canvas.findByRole("textbox", { name: "Message" });
  await waitFor(() =>
    expect(getComputedStyle(editor).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(editor);
  await userEvent.keyboard("Summarize the notes and update the roadmap.");
  await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
}
export const CapturedChanges: Story = {
  play: async ({ canvasElement }) => {
    await send(canvasElement);
    const canvas = within(canvasElement);
    const card = await canvas.findByRole("region", {
      name: "Saved turn changes",
    });
    await waitFor(() => expect(card).toHaveTextContent("3 files changed"));
    await userEvent.click(
      within(card).getByRole("button", { name: "View changes" }),
    );
    await expect(
      canvas.findByRole("complementary", { name: "Session changes" }),
    ).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Close session changes" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.findByRole("region", { name: "Saved turn changes" }),
    ).resolves.toBeVisible();
  },
};
export const UndoTurn: Story = {
  play: async ({ canvasElement }) => {
    await send(canvasElement);
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const card = await canvas.findByRole("region", {
      name: "Saved turn changes",
    });
    await waitFor(() =>
      expect(
        within(card).getByRole("button", { name: "Undo turn" }),
      ).toBeEnabled(),
    );
    await userEvent.click(
      within(card).getByRole("button", { name: "Undo turn" }),
    );
    const dialog = await page.findByRole("alertdialog");
    await expect(dialog).toHaveTextContent("human or external edits");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Undo changes" }),
    );
    await waitFor(() =>
      expect(aiReviewValue(canvasElement, "undone")).toBe("1"),
    );
    await waitFor(() => {
      expect(dialog).not.toBeVisible();
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none");
    });
  },
};
export const CheckpointFailure: Story = {
  args: { failure: true },
  play: async ({ canvasElement }) => {
    await send(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("alertdialog");
    expect(JSON.parse(aiReviewValue(canvasElement, "prompts"))).toHaveLength(0);
    await expect(
      page.findByText(
        "Fixture disk is unavailable. The prompt has not been sent.",
      ),
    ).resolves.toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Continue without history" }),
    );
    await waitFor(() =>
      expect(JSON.parse(aiReviewValue(canvasElement, "prompts"))).toHaveLength(
        1,
      ),
    );
    await waitFor(() => {
      expect(dialog).not.toBeVisible();
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none");
    });
  },
};
export const IncompleteTurn: Story = {
  args: { unknown: true },
  play: async ({ canvasElement }) => {
    await send(canvasElement);
    const card = await within(canvasElement).findByRole("region", {
      name: "Saved turn changes",
    });
    await expect(card).toHaveTextContent("Changes not fully captured");
    await expect(
      within(card).getByRole("button", { name: "Undo turn" }),
    ).toBeDisabled();
  },
};
