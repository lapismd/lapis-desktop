// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";

const meta = {
  title: "Desktop/AI/Note links",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
  args: {
    enableMarkdown: true,
    seededHeight: "calc(100dvh - 2rem)",
    seedItems: [
      {
        id: "prompt",
        type: "message",
        role: "user",
        text: "Summarize @Notes/alpha.md",
      },
      {
        id: "answer",
        type: "message",
        role: "assistant",
        text:
          "Read [the note](Notes/alpha.md) or [[Notes/alpha.md|Alpha]].\n\n" +
          "Code stays literal: `@Notes/alpha.md`.\n\n```md\n@[[Notes/alpha.md]]\n```\n\n" +
          "Unavailable: @Missing.md and [[Missing.md]].",
      },
    ],
  },
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("link", { name: "Notes/alpha.md" });
    expect(canvas.getAllByRole("link")).toHaveLength(3);
    expect(canvas.getByRole("link", { name: "Alpha" })).toBeVisible();
    expect(canvas.queryByRole("link", { name: "Missing.md" })).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Document view" }),
    );
    const note = canvas.getByRole("link", { name: "the note" });
    note.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
        "data-opened-paths",
        "Notes/alpha.md",
      ),
    );
    expect(canvas.getAllByRole("link")).toHaveLength(3);
  },
};
