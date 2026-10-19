import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AiShellDemo from "../../support/ai/shell/AiShellDemo.svelte";
import { expect, userEvent, within, waitFor } from "storybook/test";

const meta = {
  title: "Desktop/AI/Chat layout review",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { scenario: "registry-chat", reviewLayout: true },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Conversation: Story = {};
export const SendingError: Story = {
  args: { scenario: "sending-error" },
};
export const LiveInboxControls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const editor = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard("/help");
    const option = await page.findByRole("option", { name: /^\/help App/ });
    const label = option.querySelector(".cm-completionLabel")!;
    const detail = option.querySelector(".cm-completionDetail")!;
    expect(detail.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().bottom,
    );
    expect(getComputedStyle(detail).whiteSpace).toBe("normal");
    await userEvent.keyboard("{Escape}");
    const opener = canvas.getByRole("button", {
      name: "Show details for vault.read · Notes/Welcome.md",
    });
    await userEvent.click(opener);
    const inspector = await page.findByLabelText("Tool details");
    await expect(
      within(inspector).findByText("Welcome to the project"),
    ).resolves.toBeVisible();
    await userEvent.click(
      within(inspector).getByRole("button", { name: /^Source$/ }),
    );
    await expect(
      within(inspector).findByRole("textbox", { name: /Notes\/Welcome.md/ }),
    ).resolves.toHaveTextContent("# Welcome to the project");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
    await expect(editor).toHaveTextContent("/help");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(editor).toBeInTheDocument();
    await expect(editor).toHaveTextContent("/help");
  },
};
export const FixedErrorFeedback: Story = {
  name: "Inline interruption feedback",
  args: { scenario: "sending-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const error = await canvas.findByRole("alert");
    await expect(error).toHaveTextContent("Your message is retained");
    expect(error).toHaveAccessibleName("Turn interrupted");
    expect(canvas.getAllByRole("alert")).toHaveLength(1);
    expect(
      canvasElement.querySelector(".transcript-send-hint [role='alert']"),
    ).toBeNull();
    const retry = within(error).getByRole("button", { name: "Retry message" });
    expect(retry.textContent?.trim()).toBe("");
    expect(
      error.getBoundingClientRect().right - retry.getBoundingClientRect().right,
    ).toBeLessThan(20);
    retry.focus();
    await expect(
      within(canvasElement.ownerDocument.body).findByRole("tooltip"),
    ).resolves.toHaveTextContent("Retry message");
    retry.blur();
    const footer = canvasElement.querySelector(".ai-session-footer")!;
    expect(error.closest(".ai-session-footer")).toBeNull();
    await waitFor(() =>
      expect(error.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        footer.getBoundingClientRect().top,
      ),
    );
    expect(
      parseFloat(getComputedStyle(error).borderBottomLeftRadius),
    ).toBeGreaterThan(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.getByRole("textbox", { name: /^Message$/ }),
    ).toHaveTextContent("Summarize the open questions");
    await expect(
      canvas.getByRole("button", { name: "Send message" }),
    ).toBeVisible();
  },
};
export const FailedSendRetainsDraft: Story = {
  args: { scenario: "send-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const editor = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard(
      "Keep this authored message after the failed send",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const error = await within(panel).findByRole("alert");
    await expect(error).toHaveTextContent(/retained|acknowledged|queued/i);
    await expect(editor).toHaveTextContent(
      "Keep this authored message after the failed send",
    );
    expect(error.closest(".ai-session-footer")).toBeNull();
  },
};
