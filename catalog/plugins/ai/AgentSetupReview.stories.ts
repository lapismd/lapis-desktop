import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { agentMentionToken } from "@lapismd/jj-conversations";

const meta = {
  title: "Desktop/AI/Agent setup review",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AgentsAndMentions: Story = {};
export const TabAcceptsAgentSuggestion: Story = {
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole("textbox", {
      name: "Message",
    });
    await userEvent.click(editor);
    await userEvent.keyboard("@re");
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("option", { name: /Reviewer/ });
    await userEvent.keyboard("{Tab}");
    await within(editor).findByRole("button", { name: /About .*Reviewer/ });
    expect(editor).not.toHaveTextContent("@re");
  },
};
export const InlineTagsAndFollowUps: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Inline removable agent and resource tags in the shared editor. Send a simulated message to review automatic follow-up tags, or use @ to change the preference. No live provider is connected.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = await within(canvasElement).findByRole("textbox", {
      name: "Message",
    });
    await userEvent.click(editor);
    const draft = `Ask ${agentMentionToken("reviewer")} to review @Notes/alpha.md with [Alex Morgan](lapis://people/review-alex) and [the backup guide](https://lapis.md/docs/backup). `;
    await userEvent.type(
      editor,
      draft.replaceAll("[", "[[").replaceAll("{", "{{"),
    );
    const body = within(canvasElement.ownerDocument.body);
    const file = await within(editor).findByRole("button", {
      name: "Preview alpha.md",
    });
    const chip = file.closest(".chat-inline-reference")!;
    expect(parseFloat(getComputedStyle(chip).marginBlockStart)).toBeGreaterThan(
      0,
    );
    expect(parseFloat(getComputedStyle(chip).marginBlockEnd)).toBeGreaterThan(
      0,
    );
    await userEvent.hover(file);
    await body.findByText("TODO: summarize this note.", {}, { timeout: 3000 });
    await userEvent.unhover(file);
    await userEvent.click(
      within(canvasElement).getByRole("combobox", {
        name: "Tag people or agents",
      }),
    );
    const search = await body.findByPlaceholderText("Search people or agents");
    await waitFor(() => {
      const row = search.closest(".agent-picker-search")!;
      expect(getComputedStyle(row).borderBottomWidth).toBe("0px");
      const wrapper = search.closest('[data-ui-part="input-wrapper"]')!;
      expect(getComputedStyle(wrapper).borderBottomColor).toBe(
        "rgba(0, 0, 0, 0)",
      );
    });
    await userEvent.click(
      body.getByRole("button", { name: "Close agent selector" }),
    );
  },
};
