import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import RequestDemo from "../../support/ai/RequestDemo.svelte";

const meta = {
  title: "Desktop/AI/Requests",
  component: RequestDemo,
  tags: ["visual-pending", "!autodocs"],
  args: {
    mode: "permission",
    request: {
      id: "permission",
      kind: "write",
      title: "Update note",
      origin: "runtime",
      tool: { name: "notes_write" },
      options: [
        { id: "opaque::deny::v2", kind: "deny-once", label: "Deny update" },
        {
          id: "provider-policy-v7",
          kind: "allow-always",
          label: "Allow update",
        },
      ],
    },
    onRespond: fn(),
  },
} satisfies Meta<typeof RequestDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OpaquePermission: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /Allow update/ }),
    );
    await expect(args.onRespond).toHaveBeenCalledWith("provider-policy-v7");
  },
};
export const DisabledPermission: Story = {
  args: { disabled: true, onRespond: fn() },
  play: async ({ args, canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: /Allow update/ }),
    ).toBeDisabled();
    await expect(args.onRespond).not.toHaveBeenCalled();
  },
};
export const Question: Story = {
  args: { mode: "question", onAnswer: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /Other/ }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Format answer" }),
      "Structured notes",
    );
    await expect(
      canvas.getByRole("button", { name: "Submit answer" }),
    ).toBeEnabled();
  },
};
export const FreshQuestion: Story = {
  args: { mode: "fresh" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const answer = canvas.getByLabelText("Answer answer");
    await expect(answer).toHaveAttribute("type", "password");
    await userEvent.type(answer, "disposable fixture answer");
    await userEvent.click(
      canvas.getByRole("button", { name: "Submit answer" }),
    );
    await expect(canvas.getByText("Private question 2")).toBeVisible();
    await expect(answer).toHaveValue("");
    await expect(
      canvas.getByRole("button", { name: "Submit answer" }),
    ).toBeDisabled();
  },
};
