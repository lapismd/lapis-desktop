import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI/Queued messages",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed-approval" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SingleComposerAction: Story = {
  args: { embeddedShell: true },
  play: async ({ canvasElement }) => {
    const duplicates: string[][] = [];
    const observer = new MutationObserver(() => {
      const actions = Array.from(
        canvasElement.querySelectorAll(
          'button[aria-label="Stop agent"], button[aria-label="Queue message"]',
        ),
      ).map((button) => button.getAttribute("aria-label")!);
      if (actions.length > 1) duplicates.push(actions);
    });
    observer.observe(canvasElement, {
      childList: true,
      attributes: true,
      subtree: true,
    });
    try {
      const { c } = await start(canvasElement);
      for (const view of ["Document", "Classic"]) {
        if (view === "Classic")
          await userEvent.click(
            c.getByRole("button", {
              name: /^(?:Classic|Switch to Classic view)$/,
            }),
          );
        const editor = await c.findByRole("textbox", { name: "Message" });
        await expect(
          c.findByRole("button", { name: "Stop agent" }),
        ).resolves.toBeVisible();
        expect(c.queryByRole("button", { name: "Queue message" })).toBeNull();
        await userEvent.click(editor);
        const draft = `Follow-up from ${view}`;
        await userEvent.keyboard(draft);
        await expect(
          c.findByRole("button", { name: "Queue message" }),
        ).resolves.toBeEnabled();
        expect(c.queryByRole("button", { name: "Stop agent" })).toBeNull();
        await userEvent.keyboard("{Backspace}".repeat(draft.length));
        await expect(
          c.findByRole("button", { name: "Stop agent" }),
        ).resolves.toBeVisible();
      }
      await expect(
        c.findByRole("button", { name: "Stop agent" }),
      ).resolves.toBeVisible();
      expect(c.queryByRole("button", { name: "Queue message" })).toBeNull();
      expect(duplicates).toEqual([]);
    } finally {
      observer.disconnect();
    }
  },
};
async function start(canvasElement: HTMLElement) {
  const c = within(canvasElement),
    editor = await c.findByRole("textbox", { name: "Message" });
  await waitFor(() =>
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(editor);
  await userEvent.keyboard("Active review awaiting approval");
  await userEvent.click(c.getByRole("button", { name: "Send message" }));
  await c.findByText("Allow the fake agent to continue?");
  await waitFor(() =>
    expect(editor).not.toHaveTextContent("Active review awaiting approval"),
  );
  return { c, editor };
}
export const QueueAndCancel: Story = {
  play: async ({ canvasElement }) => {
    const { c, editor } = await start(canvasElement);
    await userEvent.click(editor);
    await userEvent.keyboard("Review the documentation after this turn");
    await expect(
      c.getByRole("button", { name: "Queue message" }),
    ).toHaveAttribute("data-action", "queue");
    await userEvent.click(c.getByRole("button", { name: "Queue message" }));
    const queue = await c.findByRole("region", { name: "Queued messages" });
    await expect(
      within(queue).getByText("Review the documentation after this turn"),
    ).toBeVisible();
    await expect(c.getByRole("button", { name: "Stop agent" })).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Classic" }));
    await expect(
      c.getByRole("region", { name: "Queued messages" }),
    ).toBeVisible();
    await userEvent.click(
      c.getByRole("button", { name: /Cancel queued message for/ }),
    );
    await waitFor(() =>
      expect(c.queryByRole("region", { name: "Queued messages" })).toBeNull(),
    );
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      1,
    );
    await userEvent.click(c.getByRole("button", { name: "Stop agent" }));
  },
};
export const DispatchAfterCompletion: Story = {
  play: async ({ canvasElement }) => {
    const { c, editor } = await start(canvasElement);
    await userEvent.click(editor);
    await userEvent.keyboard("Then check the queued follow-up");
    await userEvent.click(c.getByRole("button", { name: "Queue message" }));
    await c.findByRole("region", { name: "Queued messages" });
    await userEvent.click(c.getByRole("button", { name: /Allow once/ }));
    await waitFor(() =>
      expect(
        JSON.parse(aiReviewValue(canvasElement, "sessions")).flatMap(
          (s: any) => s.prompts,
        ),
      ).toContain("Then check the queued follow-up"),
    );
    await userEvent.click(await c.findByRole("button", { name: /Allow once/ }));
    await waitFor(() =>
      expect(c.queryByRole("button", { name: "Stop agent" })).toBeNull(),
    );
    expect(c.queryByRole("region", { name: "Queued messages" })).toBeNull();
  },
};
export const PauseAndResume: Story = {
  play: async ({ canvasElement }) => {
    const { c, editor } = await start(canvasElement);
    await userEvent.click(editor);
    await userEvent.keyboard("Keep this follow-up while paused");
    await userEvent.click(c.getByRole("button", { name: "Queue message" }));
    await c.findByRole("region", { name: "Queued messages" });
    await userEvent.click(c.getByRole("button", { name: "Stop agent" }));
    await expect(
      c.findByRole("button", { name: "Resume queue" }),
    ).resolves.toBeVisible();
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      1,
    );
    await waitFor(() =>
      expect(c.getByRole("button", { name: "Resume queue" })).toBeEnabled(),
    );
    await userEvent.click(c.getByRole("button", { name: "Resume queue" }));
    await waitFor(() =>
      expect(
        JSON.parse(aiReviewValue(canvasElement, "sessions")).flatMap(
          (s: any) => s.prompts,
        ),
      ).toContain("Keep this follow-up while paused"),
    );
    await userEvent.click(await c.findByRole("button", { name: /Allow once/ }));
    await waitFor(() =>
      expect(c.queryByRole("button", { name: "Stop agent" })).toBeNull(),
    );
  },
};

export const RestoredQueue: Story = {
  args: { scenario: "queue-restored" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("region", { name: "Queued messages" });
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toEqual([]);
    await expect(
      c.getByText("A saved follow-up waits for explicit resume"),
    ).toBeVisible();
    await userEvent.click(c.getByRole("button", { name: "Resume queue" }));
    await waitFor(() =>
      expect(
        JSON.parse(aiReviewValue(canvasElement, "sessions")).flatMap(
          (s: any) => s.prompts,
        ),
      ).toEqual(["A saved follow-up waits for explicit resume"]),
    );
    await waitFor(() =>
      expect(c.queryByRole("region", { name: "Queued messages" })).toBeNull(),
    );
  },
};
export const FailedQueueSave: Story = {
  args: { scenario: "queue-failure" },
  play: async ({ canvasElement }) => {
    const { c, editor } = await start(canvasElement);
    await userEvent.click(editor);
    await userEvent.keyboard("Keep this draft when queue storage fails");
    await userEvent.click(c.getByRole("button", { name: "Queue message" }));
    const page = within(document.body);
    await expect(
      page.findByText("Fixture queue storage unavailable"),
    ).resolves.toBeVisible();
    expect(page.getAllByText("Fixture queue storage unavailable")).toHaveLength(
      1,
    );
    await expect(editor).toHaveTextContent(
      "Keep this draft when queue storage fails",
    );
    expect(c.queryByRole("region", { name: "Queued messages" })).toBeNull();
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      1,
    );
    await userEvent.click(c.getByRole("button", { name: "Stop agent" }));
  },
};

export const InterruptedBeforeCheckpoint: Story = {
  args: { scenario: "queue-crashed" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("region", { name: "Queued messages" });
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toEqual([]);
    await userEvent.click(c.getByRole("button", { name: "Resume queue" }));
    await c.findByText("Allow the fake agent to continue?");
    expect(
      c.getAllByText(/The previous turn's outcome is unknown/),
    ).toHaveLength(1);
    await userEvent.click(c.getByRole("button", { name: /Allow once/ }));
    await waitFor(() =>
      expect(c.queryByRole("region", { name: "Queued messages" })).toBeNull(),
    );
    expect(
      JSON.parse(aiReviewValue(canvasElement, "sessions")).flatMap(
        (s: any) => s.prompts,
      ),
    ).toEqual(["A saved follow-up waits for explicit resume"]);
  },
};

export const WaitingFollowups: Story = {
  play: async ({ canvasElement }) => {
    const { c, editor } = await start(canvasElement);
    for (const text of [
      "Review the documentation after the active turn",
      "Then check the examples and propose a summary",
    ]) {
      await userEvent.click(editor);
      await userEvent.keyboard(text);
      await userEvent.click(c.getByRole("button", { name: "Queue message" }));
      await expect(c.findByText(text)).resolves.toBeVisible();
    }
    await expect(c.getByRole("button", { name: "Stop agent" })).toBeVisible();
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      1,
    );
  },
};
