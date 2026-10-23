import { findMessageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { aiReviewValue } from "../../support/ai/review.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Action approvals",
  component: TranscriptReviewDemo,
  args: { scenario: "approval", embeddedShell: true },
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
const settled = () =>
  waitFor(() =>
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
  );
async function choose(canvasElement: HTMLElement, name: string) {
  const canvas = within(canvasElement),
    body = within(canvasElement.ownerDocument.body);
  await settled();
  await userEvent.click(
    await canvas.findByRole("button", { name: /^Action approvals:/ }),
  );
  await userEvent.click(await body.findByRole("option", { name }));
}
export const Picker: Story = { args: { scenario: "mode-menu" } };
export const SeparateFromMode: Story = {
  args: { scenario: "mode-menu" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      b = within(canvasElement.ownerDocument.body);
    await choose(canvasElement, "Approve for me");
    await c.findByRole("button", { name: "Action approvals: Approve for me" });
    expect(
      JSON.parse(aiReviewValue(canvasElement, "settings")).approvalPolicy,
    ).toBe("allow-all");
    await settled();
    await userEvent.click(
      c.getByRole("button", { name: "Conversation actions" }),
    );
    await userEvent.click(await b.findByRole("menuitem", { name: /^Mode:/ }));
    await userEvent.click(
      await b.findByRole("menuitemradio", { name: "Build" }),
    );
    await settled();
    await userEvent.click(
      c.getByRole("button", { name: /^(?:Classic|Switch to Classic view)$/ }),
    );
    await expect(
      c.findByRole("button", { name: "Action approvals: Approve for me" }),
    ).resolves.toBeVisible();
    await choose(canvasElement, "Ask for approval");
    await c.findByRole("button", {
      name: "Action approvals: Ask for approval",
    });
    await settled();
    await userEvent.click(
      c.getByRole("button", { name: "Conversation actions" }),
    );
    await waitFor(() =>
      expect(
        b.getByRole("menuitem", { name: /Mode: (?:Build|build)/ }),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await settled();
  },
};
export const AutomaticApproval: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await choose(canvasElement, "Approve for me");
    await c.findByRole("button", { name: "Action approvals: Approve for me" });
    await settled();
    const editor = await findMessageEditor(c);
    await userEvent.click(editor);
    await userEvent.keyboard("A fixture turn with automatic approval");
    await userEvent.click(c.getByRole("button", { name: "Send message" }));
    await waitFor(() =>
      expect(c.getByRole("button", { name: "Send message" })).toBeVisible(),
    );
    expect(c.queryByRole("button", { name: "Allow once" })).toBeNull();
    await waitFor(() =>
      expect(aiReviewValue(canvasElement, "sessions")).toContain(
        "A fixture turn with automatic approval",
      ),
    );
    await userEvent.click(
      await c.findByRole("button", { name: /^Permission granted:/ }),
    );
    const result = await c.findByTestId("ai-approval-card");
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("data-state", "approved");
  },
};
export const SaveFailure: Story = {
  args: { scenario: "participant-settings-failure" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const editor = await findMessageEditor(c);
    await settled();
    await userEvent.click(editor);
    await userEvent.keyboard("Retain this draft");
    await choose(canvasElement, "Approve for me");
    await waitFor(() =>
      expect(aiReviewValue(canvasElement, "notifications")).toContain(
        "Fixture participant save unavailable",
      ),
    );
    expect(
      JSON.parse(aiReviewValue(canvasElement, "settings")).approvalPolicy,
    ).toBe("ask");
    expect(editor).toHaveTextContent("Retain this draft");
    expect(
      c.getByRole("button", { name: "Action approvals: Ask for approval" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await settled();
  },
};
