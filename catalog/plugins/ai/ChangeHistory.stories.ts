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
    const changes = await canvas.findByRole("button", {
      name: "Show conversation changes",
    });
    const header = changes.closest("header")!;
    await expect(
      within(header).getByRole("button", { name: "Switch to Classic view" }),
    ).toBeVisible();
    await expect(changes).toHaveTextContent("");
    await userEvent.hover(changes);
    await waitFor(() => {
      const tooltip = canvasElement.ownerDocument.body.querySelector(
        '[data-slot="tooltip-content"]',
      );
      expect(tooltip).toBeVisible();
      expect(tooltip).toHaveTextContent("Changes");
    });
    await userEvent.unhover(changes);
    await userEvent.click(changes);
    const headerRail = await canvas.findByRole("complementary", {
      name: "Session changes",
    });
    await expect(
      await within(headerRail).findByRole("tab", { name: "Conversation" }),
    ).toHaveAttribute("data-state", "active");
    await userEvent.click(
      within(headerRail).getByRole("tab", { name: "This turn" }),
    );
    await userEvent.click(
      within(headerRail).getByRole("button", { name: "Close session changes" }),
    );

    const draft = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(draft);
    await userEvent.keyboard("Keep this unsent draft");
    await userEvent.click(
      within(card).getByRole("button", { name: "View changes" }),
    );
    const rail = await canvas.findByRole("complementary", {
      name: "Session changes",
    });
    await expect(rail).toBeVisible();
    await expect(rail).toHaveAttribute("data-ui-part", "body-sidebar");
    await expect(
      await within(rail).findByRole("tab", { name: "This turn" }),
    ).toHaveAttribute("data-state", "active");
    await userEvent.click(
      await within(rail).findByRole("tab", {
        name: "Conversation",
      }),
    );
    await expect(
      within(rail).getByRole("navigation", { name: "Conversation turns" }),
    ).toBeVisible();
    await userEvent.click(within(rail).getByText("alpha.md", { exact: true }));
    const file = await canvas.findByRole("region", {
      name: "Saved changes to Notes/alpha.md",
    });
    await expect(file).toBeVisible();
    await waitFor(() =>
      expect(file).toHaveTextContent(
        "A clear, concise summary of the project.",
      ),
    );
    await expect(rail).not.toContainElement(file);
    await expect(card).not.toBeVisible();
    await userEvent.click(within(file).getByRole("tab", { name: "Before" }));
    await waitFor(() =>
      expect(file).toHaveTextContent("TODO: summarize this note."),
    );
    await userEvent.click(
      within(file).getByRole("button", { name: "Close saved file" }),
    );
    await expect(card).toBeVisible();
    await expect(draft).toHaveTextContent("Keep this unsent draft");
    await expect(
      within(card).getByRole("button", { name: /Copy Git commit SHA/ }),
    ).toBeVisible();
    await expect(
      within(card).getByRole("button", { name: /Copy JJ Change ID/ }),
    ).toBeVisible();
    const surface = card.closest("[data-surface]");
    await expect(surface).toHaveAttribute("data-surface", "plain");
    await userEvent.click(
      canvas.getByRole("button", { name: "Close session changes" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.findByRole("region", { name: "Saved turn changes" }),
    ).resolves.toBeVisible();
    const classicChanges = canvas.getByRole("button", {
      name: "Show conversation changes",
    });
    await expect(
      within(classicChanges.closest("header")!).getByRole("button", {
        name: "Switch to Document view",
      }),
    ).toBeVisible();
  },
};
export const ViewNavigation: Story = {
  play: async ({ canvasElement }) => {
    await send(canvasElement);
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const draft = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(draft);
    await userEvent.keyboard("Keep this navigation draft");
    expect(
      canvas.queryByRole("button", { name: "Show conversation history" }),
    ).toBeNull();
    const destinations = [
      ["AI conversations", "ai-conversation-history"],
      ["Catalog", "ai-catalog"],
      ["Import AI sessions", "ai-import"],
    ];
    for (const [label, type] of destinations) {
      for (let attempt = 0; attempt < 2; attempt++) {
        await waitFor(() =>
          expect(
            getComputedStyle(
              canvas.getByRole("button", { name: "Conversation actions" }),
            ).pointerEvents,
          ).not.toBe("none"),
        );
        await userEvent.click(
          canvas.getByRole("button", { name: "Conversation actions" }),
        );
        const view = await page.findByRole("menuitem", { name: "View" });
        expect(view.querySelector("svg")).not.toBeNull();
        await userEvent.hover(view);
        const item = await page.findByRole("menuitem", { name: label });
        expect(item.querySelector("svg")).not.toBeNull();
        expect(item).not.toHaveAttribute("data-disabled");
        expect(page.queryByRole("menuitem", { name: "AI JSONL" })).toBeNull();
        await userEvent.click(item);
        await waitFor(() =>
          expect(aiReviewValue(canvasElement, "active-view")).toBe(type),
        );
        await expect(
          canvas.findByTestId(type === "ai-import" ? "ai-import-panel" : type),
        ).resolves.toBeVisible();
        expect(aiReviewValue(canvasElement, `leaves:${type}`)).toBe("1");
        await aiReviewAction(canvasElement, "return-chat");
        await expect(draft).toBeVisible();
        await expect(draft).toHaveTextContent("Keep this navigation draft");
      }
    }
  },
};
export const UnavailableViews: Story = {
  args: { navigation: false },
  play: async ({ canvasElement }) => {
    await aiReviewAction(canvasElement, "ready");
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        getComputedStyle(
          canvas.getByRole("button", { name: "Conversation actions" }),
        ).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Conversation actions" }),
    );
    await userEvent.hover(await page.findByRole("menuitem", { name: "View" }));
    for (const name of ["AI conversations", "Catalog", "Import AI sessions"])
      await expect(await page.findByRole("menuitem", { name })).toHaveAttribute(
        "data-disabled",
      );
    await userEvent.keyboard("{Escape}{Escape}");
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
