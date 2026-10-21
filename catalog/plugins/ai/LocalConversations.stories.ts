import { expect, userEvent, within, waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Local ACP conversations",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed", embeddedShell: true },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
const menuSettled = (element: HTMLElement) =>
  waitFor(() =>
    expect(getComputedStyle(element.ownerDocument.body).pointerEvents).not.toBe(
      "none",
    ),
  );
export const AgentsAndLocalHistory: Story = {};
export const ApprovalsAndCancellation: Story = {
  args: { scenario: "addressed-approval" },
};

export const PermissionsInFooter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const button = await canvas.findByRole("button", {
      name: "Conversation actions",
    });
    await waitFor(() => expect(button).toBeEnabled());
    await menuSettled(canvasElement);
    await userEvent.click(button);
    await userEvent.click(
      await body.findByRole("menuitem", { name: /^Mode:/ }),
    );
    await waitFor(() =>
      expect(
        body.getByRole("menuitem", { name: /^Use agent default/ }),
      ).toBeVisible(),
    );
    const edit = await body.findByRole("menuitemradio", {
      name: "Workspace edits",
    });
    await userEvent.click(edit);
    await menuSettled(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^(?:Classic|Switch to Classic view)$/,
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Conversation actions" }),
    );
    await waitFor(() =>
      expect(
        body.getByRole("menuitem", {
          name: /Mode: (?:Workspace edits|fixture-edit)/,
        }),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await menuSettled(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^(?:Document|Switch to Document view)$/,
      }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Conversation actions" }),
    );
    await userEvent.click(
      await body.findByRole("menuitem", { name: /^Mode:/ }),
    );
    await expect(
      body.findByRole("menuitemradio", { name: "Workspace edits" }),
    ).resolves.toHaveAttribute("aria-checked", "true");
  },
};

export const SupportedModesAndPin: Story = {
  args: { scenario: "mode-menu" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const open = async () => {
      await menuSettled(canvasElement);
      await userEvent.click(
        await canvas.findByRole("button", { name: "Conversation actions" }),
      );
    };
    expect(
      canvas.queryByRole("button", { name: /Pin conversation/ }),
    ).toBeNull();
    await open();
    await userEvent.click(
      await body.findByRole("menuitem", { name: /Mode: plan/ }),
    );
    await expect(
      body.findByRole("menuitemradio", { name: "Plan" }),
    ).resolves.toHaveAttribute("aria-checked", "true");
    expect(body.queryByRole("menuitemradio", { name: "Ask" })).toBeNull();
    await userEvent.click(body.getByRole("menuitemradio", { name: "Build" }));
    await open();
    await waitFor(() =>
      expect(
        body.getByRole("menuitem", { name: /Mode: (?:Build|build)/ }),
      ).toBeVisible(),
    );
    await userEvent.click(body.getByRole("menuitem", { name: "Pin Chat" }));
    await open();
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Unpin Chat" }),
    );
    await menuSettled(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /^(?:Classic|Switch to Classic view)$/,
      }),
    );
    await open();
    await userEvent.click(
      await body.findByRole("menuitem", { name: /Mode: (?:Build|build)/ }),
    );
    await expect(
      body.findByRole("menuitemradio", { name: "Build" }),
    ).resolves.toHaveAttribute("aria-checked", "true");
  },
};
