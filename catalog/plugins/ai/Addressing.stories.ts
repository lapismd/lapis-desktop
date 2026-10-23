import { findMessageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { aiReviewValue } from "../../support/ai/review.ts";

const meta = {
  title: "Desktop/AI/Addressed messages",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SavedRecipients: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("group", { name: "Sent to" }),
    ).resolves.toHaveTextContent("@Previous reviewer");
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
  },
};
export const ReadyToSend: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await findMessageEditor(canvas);
    await userEvent.click(editor);
    await userEvent.keyboard("@review");
    await userEvent.click(
      await canvas.findByRole("option", { name: /Reviewer/ }),
    );
    await userEvent.keyboard(
      "Compare today’s note against the earlier review.",
    );
    await expect(
      canvas.findByRole("button", { name: "Remove recipient @Reviewer" }),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
  },
};
export const SelectRemoveAndSwitch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await findMessageEditor(canvas);
    await userEvent.click(editor);
    await userEvent.keyboard("@review");
    await userEvent.click(
      await canvas.findByRole("option", { name: /Reviewer/ }),
    );
    const recipient = await canvas.findByRole("button", {
      name: "Remove recipient @Reviewer",
    });
    expect(editor).not.toHaveTextContent("jj-store-agent:");
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
    await userEvent.keyboard("Keep my draft");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(recipient).toBeVisible();
    await expect(editor).toHaveTextContent("Keep my draft");
    await userEvent.click(recipient);
    expect(
      canvas.queryByRole("button", { name: "Remove recipient @Reviewer" }),
    ).toBeNull();
    expect(editor).toHaveTextContent("Keep my draft");
  },
};
export const ExplicitSend: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await findMessageEditor(canvas);
    await userEvent.click(editor);
    await userEvent.keyboard("@review");
    await userEvent.click(
      await canvas.findByRole("option", { name: /Reviewer/ }),
    );
    await userEvent.keyboard("Review this note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      const transcript = JSON.parse(aiReviewValue(canvasElement, "transcript"));
      expect(transcript).toContainEqual(
        expect.objectContaining({
          type: "message",
          role: "user",
          text: "Review this note",
          recipients: [
            {
              id: "reviewer",
              label: "Reviewer",
              token: "jj-store-agent:7265766965776572;",
            },
          ],
        }),
      );
    });
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Remove recipient @Reviewer" }),
      ).toBeNull(),
    );
    expect(
      canvas.getAllByRole("group", { name: "Sent to" }).at(-1),
    ).toHaveTextContent("@Reviewer");
  },
};

export const IndependentParticipants: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, prompt] of [
      ["Reviewer", "Review the note"],
      ["Writer", "Draft the follow-up"],
      ["Reviewer", "Review the follow-up"],
    ]) {
      const editor = await findMessageEditor(canvas);
      await userEvent.click(editor);
      await userEvent.keyboard(`@${name.toLowerCase()}`);
      await userEvent.click(
        await canvas.findByRole("option", { name: new RegExp(name!) }),
      );
      await userEvent.keyboard(prompt!);
      await userEvent.click(
        canvas.getByRole("button", { name: "Send message" }),
      );
      await waitFor(() =>
        expect(
          canvas.queryByRole("button", { name: `Remove recipient @${name}` }),
        ).toBeNull(),
      );
      await waitFor(() =>
        expect(
          canvas.getAllByText(name!, { exact: true }).length,
        ).toBeGreaterThan(0),
      );
    }
    await waitFor(() => {
      const sessions = JSON.parse(aiReviewValue(canvasElement, "sessions"));
      expect(sessions).toHaveLength(3);
      expect(sessions[2].id).toBe(sessions[0].id);
      expect(sessions[1].id).not.toBe(sessions[0].id);
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(canvas.findAllByText(/Writer/)).resolves.not.toHaveLength(0);
    await expect(canvas.findAllByText(/Reviewer/)).resolves.not.toHaveLength(0);
  },
};
