import { findMessageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";

const meta = {
  title: "Desktop/AI/Agent mention links",
  component: TranscriptReviewDemo,
  args: { scenario: "agent-links", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownBadges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badges = () =>
      canvasElement.querySelectorAll(
        '[data-chat-reader] [data-agent-reference="reviewer"]',
      );
    await waitFor(() => expect(badges()).toHaveLength(5));
    const badge = within(badges()[0]! as HTMLElement).getByRole("button", {
      name: /Nyra/,
    });
    await userEvent.hover(badge);
    await waitFor(() =>
      expect(
        within(document.body).getByRole("group", { name: "About Nyra" }),
      ).toBeVisible(),
    );
    await userEvent.unhover(badge);
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await waitFor(() => expect(badges()).toHaveLength(5));
    expect(
      canvasElement.querySelector("[data-chat-reader]")?.textContent,
    ).toContain("Code stays literal");
  },
};

export const ComposerSuggestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await findMessageEditor(canvas);
    await userEvent.click(editor);
    await userEvent.keyboard("@review");
    const option = await within(document.body).findByRole("option", {
      name: /Reviewer/,
    });
    await waitFor(() => {
      const box = option.getBoundingClientRect();
      expect(
        document
          .elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          ?.closest('[role="option"]'),
      ).toBe(option);
    });
    expect(editor.closest(".cm-editor")!.contains(option)).toBe(false);
    await userEvent.click(option);
    await userEvent.keyboard("Review this note");
    await expect(
      canvas.findByRole("button", { name: "Remove @Reviewer" }),
    ).resolves.toBeVisible();
    expect(editor).not.toHaveTextContent("lapis://agent:");
  },
};
