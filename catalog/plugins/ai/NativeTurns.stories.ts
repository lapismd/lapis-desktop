import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeTurnDemo from "../../support/ai/native-turns/NativeTurnDemo.svelte";
import { getNativeTurns } from "../../support/ai/native-turns/fixture";
import { findMessageEditor } from "../../support/ai/message-editor";
import { cleanupCatalog } from "../../support/lifecycle";
const meta = {
  title: "Desktop/AI/Native turn observer",
  component: NativeTurnDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof NativeTurnDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(canvasElement: HTMLElement) {
  await waitFor(
    () =>
      expect(
        canvasElement.querySelector('[data-notes-ready="true"]'),
      ).not.toBeNull(),
    { timeout: 30000 },
  );
  const fixture = getNativeTurns(canvasElement);
  await fixture.app.commands.executeCommand("ai:open-chat");
  const editor = await findMessageEditor(within(canvasElement));
  await waitFor(() => expect(editor).toBeEnabled());
  return { fixture, editor, canvas: within(canvasElement) };
}
export const NewConversation: Story = {
  play: async ({ canvasElement }) => {
    const { fixture } = await open(canvasElement);
    expect(fixture.records).toHaveLength(0);
    expect(fixture.app.plugins.plugins.get("ai")).not.toHaveProperty(
      "application",
    );
  },
};
export const SendAndFollowUp: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, editor, canvas } = await open(canvasElement);
    await userEvent.type(editor, "First native prompt");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(fixture.records).toHaveLength(1));
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent(
        "A response persisted by the native service.",
      ),
    );
    await userEvent.type(editor, "Explicit follow-up");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(fixture.records).toHaveLength(2));
    expect(fixture.records[1].input.continuation).toEqual({
      conversation_id: fixture.records[0].conversation_id,
      after_request_id: fixture.records[0].input.request_id,
    });
  },
};
export const LostReply: Story = {
  args: { unknown: true },
  play: async ({ canvasElement }) => {
    const { fixture, editor, canvas } = await open(canvasElement);
    await userEvent.type(editor, "Retain this exact request");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(fixture.records).toHaveLength(1));
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent(/unknown|uncertain/i),
    );
    expect(fixture.calls.filter((c) => c.kind === "submit")).toHaveLength(1);
  },
};
