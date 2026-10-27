import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeQueueDemo from "../../support/ai/native-queue/NativeQueueDemo.svelte";
import { getNativeQueue } from "../../support/ai/native-queue/fixture";
import { findMessageEditor } from "../../support/ai/message-editor";
import { cleanupCatalog } from "../../support/lifecycle";

const meta = {
  title: "Desktop/AI/Native queued messages",
  component: NativeQueueDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof NativeQueueDemo>;
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
  const fixture = getNativeQueue(canvasElement);
  await fixture.app.commands.executeCommand("ai:open-chat");
  const canvas = within(canvasElement);
  const editor = await findMessageEditor(canvas);
  await waitFor(() => expect(editor).toBeEnabled());
  async function send(text: string) {
    await userEvent.type(editor, text);
    const button = await canvas.findByRole("button", {
      name: /^(Send message|Queue message)$/,
    });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
  }
  return { fixture, canvas, editor, send };
}
async function queued(canvasElement: HTMLElement) {
  const review = await open(canvasElement);
  await review.send("First running native prompt");
  await waitFor(() => expect(review.fixture.turns.records).toHaveLength(1));
  await review.send("Keep this exact queued prompt");
  await waitFor(() => expect(review.fixture.queue?.entries).toHaveLength(1));
  return review;
}
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const { fixture } = await open(canvasElement);
    expect(fixture.queue).toBeNull();
    expect(fixture.calls.filter((c) => c.kind !== "read")).toHaveLength(0);
  },
};
export const Loading: Story = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-notes-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
    );
    const fixture = getNativeQueue(canvasElement);
    await fixture.app.commands.executeCommand("ai:open-chat");
    await expect(
      within(canvasElement).findByRole("status", {
        name: "Loading conversation",
      }),
    ).resolves.toBeVisible();
    expect(fixture.calls.filter((call) => call.kind !== "read")).toHaveLength(
      0,
    );
  },
};
export const QueuedDuringRun: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, canvas } = await queued(canvasElement);
    await canvas.findByText("Keep this exact queued prompt");
    expect(fixture.turns.calls.filter((c) => c.kind === "submit")).toHaveLength(
      1,
    );
    const capture = fixture.queue!.entries[0].input.capture as {
      selection: { targets: { executionMode: string }[] };
    };
    expect(capture.selection.targets[0].executionMode).toBe("read-only");
    expect(canvas.getByRole("button", { name: "Pause queue" })).toBeEnabled();
  },
};
export const PausedRecovery: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, canvas } = await queued(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Pause queue" }),
    );
    await waitFor(() => expect(fixture.queue?.paused).toBe(true));
    const resume = await canvas.findByRole("button", { name: "Resume queue" });
    expect(resume).toBeEnabled();
  },
};
export const ExplicitResume: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, canvas } = await queued(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Pause queue" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Resume queue" }),
    );
    await waitFor(() => expect(fixture.queue?.paused).toBe(false));
    expect(fixture.calls.filter((c) => c.kind === "resume")).toHaveLength(1);
  },
};
export const CancelUnstarted: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, canvas } = await queued(canvasElement);
    const acceptance = fixture.queue!.entries[0].input.acceptance_id;
    const cancel = await canvas.findByRole("button", {
      name: "Cancel queued message for Codex",
    });
    cancel.focus();
    await waitFor(() => expect(cancel).toBeEnabled());
    await waitFor(() =>
      expect(getComputedStyle(cancel).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(cancel);
    await waitFor(() =>
      expect(fixture.queue!.entries[0].phase).toBe("cancelled"),
    );
    expect(fixture.calls.filter((c) => c.kind === "cancel")).toEqual([
      {
        kind: "cancel",
        conversation_id: fixture.queue!.conversation_id,
        acceptance_id: acceptance,
      },
    ]);
    expect(fixture.turns.calls.filter((c) => c.kind === "submit")).toHaveLength(
      1,
    );
  },
};
export const LostAcknowledgement: Story = {
  args: { scenario: "uncertain" },
  play: async ({ canvasElement }) => {
    const { fixture } = await queued(canvasElement);
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent(/unknown|uncertain/i),
    );
    expect(fixture.calls.filter((c) => c.kind === "accept")).toHaveLength(1);
    expect(fixture.queue?.entries).toHaveLength(1);
  },
};
export const NativeRefusal: Story = {
  args: { scenario: "refused" },
  play: async ({ canvasElement }) => {
    const { fixture, send } = await open(canvasElement);
    await send("First running native prompt");
    await waitFor(() => expect(fixture.turns.records).toHaveLength(1));
    await send("Refused queued prompt");
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent(
        "The native target refused this queued message",
      ),
    );
    expect(fixture.queue).toBeNull();
    expect(fixture.calls.filter((c) => c.kind === "accept")).toHaveLength(1);
  },
};
export const MissingDeclaration: Story = {
  args: { scenario: "unavailable" },
  play: async ({ canvasElement }) => {
    const { fixture, canvas, editor, send } = await open(canvasElement);
    await send("Existing R2 prompt");
    await waitFor(() => expect(fixture.turns.records).toHaveLength(1));
    await userEvent.type(editor, "Wait for the current turn");
    expect(editor).toHaveTextContent("Wait for the current turn");
    expect(fixture.turns.records[0].phase).toBe("running");
    expect(canvas.queryByRole("button", { name: "Send message" })).toBeNull();
    expect(canvas.queryByRole("button", { name: "Queue message" })).toBeNull();
    const stop = canvas.getByRole("button", { name: "Stop agent" });
    expect(stop).toBeEnabled();
    await userEvent.click(stop);
    await waitFor(() =>
      expect(fixture.turns.records[0].phase).toBe("cancelled"),
    );
    expect(editor).toHaveTextContent("Wait for the current turn");
    const continuation = await canvas.findByRole("button", {
      name: "Send message",
    });
    await waitFor(() => expect(continuation).toBeEnabled());
    await userEvent.click(continuation);
    await waitFor(() => expect(fixture.turns.records).toHaveLength(2));
    expect(fixture.turns.records[1].input.continuation).toEqual({
      conversation_id: fixture.turns.records[0].conversation_id,
      after_request_id: fixture.turns.records[0].input.request_id,
    });
    expect(fixture.calls.filter((c) => c.kind === "accept")).toHaveLength(0);
  },
};
