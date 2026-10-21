import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import SentContextDemo from "../../support/ai/sent-context/SentContextDemo.svelte";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Sent context",
  component: SentContextDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SentContextDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function send(element: HTMLElement, text: string) {
  await aiReviewAction(element, "ready");
  const canvas = within(element);
  const editor = await canvas.findByRole("textbox", { name: "Message" });
  await waitFor(() =>
    expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-initializing",
      "false",
    ),
  );
  await userEvent.click(editor);
  await userEvent.keyboard(text);
  await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
}
async function inspect(element: HTMLElement, index: number) {
  const canvas = within(element);
  await waitFor(() =>
    expect(
      canvas.getAllByRole("button", { name: "Sent context" }),
    ).toHaveLength(index + 1),
  );
  await userEvent.click(
    canvas.getAllByRole("button", { name: "Sent context" })[index]!,
  );
  const panels = canvas.getAllByRole("region", {
    name: "Application context for this message",
  });
  const panel = panels.at(-1)!;
  await expect(panel).toHaveTextContent("Lapis");
  return panel;
}
export const NewChat: Story = {
  play: async ({ canvasElement }) => {
    await send(canvasElement, "Review the structure of these notes.");
    await inspect(canvasElement, 0);
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Show raw context" }),
    );
    const wire = JSON.parse(aiReviewValue(canvasElement, "prompts"))[0].context;
    expect(wire).toContain("Current scope: Notes");
    await expect(
      canvas.findByRole("region", { name: "Raw context" }),
    ).resolves.toHaveTextContent("Current scope: Notes");
    await userEvent.click(
      canvas.getByRole("button", { name: "Show rendered context" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.findByRole("button", { name: "Sent context" }),
    ).resolves.toBeVisible();
  },
};
export const AgentSwitch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await send(canvasElement, "Review the structure of these notes.");
    await canvas.findByRole("button", { name: "Sent context" });
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Tag people or agents" }),
    );
    await userEvent.click(await page.findByRole("option", { name: /Writer/ }));
    await send(canvasElement, "Continue with a concise revision.");
    const context = await inspect(canvasElement, 1);
    await expect(context).toHaveTextContent(
      "Review the structure of these notes.",
    );
    await expect(context).toHaveTextContent("propose concise revisions");
    const inspector = within(context);
    const rootProse = inspector.getByText(
      "User-configured agent context for this session. Instructions remain subject to application permissions.",
      { exact: true },
    );
    const rootLabel = inspector
      .getByRole("button", {
        name: /^<lapis-context kind="conversation-handoff"/,
      })
      .querySelector(".ui-prompt-context-tag")!;
    await expect(rootProse).toBeVisible();
    await waitFor(() =>
      expect(
        Math.abs(
          rootProse.getBoundingClientRect().left -
            rootLabel.getBoundingClientRect().left,
        ),
      ).toBeLessThan(1),
    );
    await userEvent.click(
      inspector.getByRole("button", {
        name: /^<lapis-context kind="conversation-handoff"/,
      }),
    );
    await userEvent.click(
      inspector.getByRole("button", { name: "<lapis-handoff-evidence>" }),
    );
    const forwarded = inspector.getByText(
      /Review the structure of these notes\./,
    );
    await expect(forwarded).toBeVisible();
    const parentLabel = inspector
      .getByRole("button", { name: "<lapis-handoff-evidence>" })
      .querySelector(".ui-prompt-context-tag")!;
    await waitFor(() =>
      expect(forwarded.getBoundingClientRect().left).toBeGreaterThan(
        parentLabel.getBoundingClientRect().left,
      ),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(
      canvas.getAllByRole("button", { name: "Sent context" }),
    ).toHaveLength(2);
  },
};
export const UnknownOutcome: Story = {
  args: { unknown: true },
  play: async ({ canvasElement }) => {
    await send(canvasElement, "Inspect this prepared context.");
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("button", { name: "Context delivery unknown" }),
    ).resolves.toBeVisible();
    expect(canvas.queryByRole("button", { name: "Sent context" })).toBeNull();
  },
};
