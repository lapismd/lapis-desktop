import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { formatAgentMention } from "../../../src/lib/ai/chat/agent-mentions.ts";
import { aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI/Multiple recipients",
  component: TranscriptReviewDemo,
  args: { scenario: "addressed" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OneAuthoredMessage: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      editor = await c.findByRole("textbox", { name: "Message" });
    await userEvent.click(editor);
    for (const name of ["Reviewer", "Writer"]) {
      await userEvent.keyboard(`@${name.toLowerCase()}`);
      await userEvent.click(
        await within(canvasElement.ownerDocument.body).findByRole("option", {
          name: new RegExp(name),
        }),
      );
    }
    expect(
      within(editor).getByRole("button", { name: /About .*Reviewer/ }),
    ).toBeVisible();
    expect(
      within(editor).getByRole("button", { name: /About .*Writer/ }),
    ).toBeVisible();
    await userEvent.keyboard("Review the note together");
    await userEvent.click(c.getByRole("button", { name: "Send message" }));
    await waitFor(() => {
      const saved = JSON.parse(aiReviewValue(canvasElement, "transcript"));
      expect(
        saved.filter(
          (e: any) =>
            e.type === "message" &&
            e.role === "user" &&
            e.text ===
              `${formatAgentMention("reviewer", "Reviewer")} ${formatAgentMention("writer", "Writer")} Review the note together`,
        ),
      ).toHaveLength(1);
      expect(
        saved.filter(
          (e: any) =>
            e.type === "agent.delivery" && e.delivery.state === "completed",
        ),
      ).toHaveLength(2);
    });
    const audience = c.getAllByRole("group", { name: "Sent to" }).at(-1)!;
    expect(within(audience).getAllByText("Completed")).toHaveLength(2);
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      2,
    );
    await userEvent.click(c.getByRole("button", { name: "Classic" }));
    expect(
      within(c.getAllByRole("group", { name: "Sent to" }).at(-1)!).getAllByText(
        "Completed",
      ),
    ).toHaveLength(2);
  },
};
async function addParticipant(canvasElement: HTMLElement, name: string) {
  const c = within(canvasElement);
  await waitFor(() =>
    expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(
    await c.findByRole("button", { name: "Conversation actions" }),
  );
  const page = within(document.body);
  await userEvent.click(
    await page.findByRole("menuitem", { name: "Add Agent" }),
  );
  const dialog = within(
    await page.findByRole("dialog", { name: "Add agent participant" }),
  );
  await userEvent.type(
    dialog.getByRole("textbox", { name: "Participant name" }),
    name,
  );
  await userEvent.click(
    dialog.getByRole("button", { name: "Add participant" }),
  );
}
export const CreateNamedParticipant: Story = {
  args: { scenario: "participant-settings" },
  play: async ({ canvasElement }) => {
    await addParticipant(canvasElement, "Notes reviewer");
    await waitFor(() =>
      expect(
        within(document.body).queryByRole("dialog", {
          name: "Add agent participant",
        }),
      ).toBeNull(),
    );
    const c = within(canvasElement),
      editor = await c.findByRole("textbox", { name: "Message" });
    await waitFor(() =>
      expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(editor);
    await userEvent.keyboard("@notes");
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: /Notes reviewer/,
      }),
    );
    expect(
      within(editor).getByRole("button", { name: /About .*Notes reviewer/ }),
    ).toBeVisible();
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
  },
};
export const FailedParticipantSave: Story = {
  args: { scenario: "participant-settings-failure" },
  play: async ({ canvasElement }) => {
    await addParticipant(canvasElement, "Keep this name");
    const page = within(document.body);
    const dialog = within(
      await page.findByRole("dialog", { name: "Add agent participant" }),
    );
    await expect(
      dialog.getByRole("textbox", { name: "Participant name" }),
    ).toHaveValue("Keep this name");
    await expect(
      page.findByText("Fixture participant save unavailable"),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "sessions")).toBe("[]");
  },
};

export const VisibleWorkAndCancellation: Story = {
  args: { scenario: "addressed-approval" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      editor = await c.findByRole("textbox", { name: "Message" });
    await waitFor(() =>
      expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(editor);
    for (const name of ["Reviewer", "Writer"]) {
      await userEvent.keyboard(`@${name.toLowerCase()}`);
      await userEvent.click(
        await within(canvasElement.ownerDocument.body).findByRole("option", {
          name: new RegExp(name),
        }),
      );
    }
    await userEvent.keyboard("Wait for my approval before continuing");
    await userEvent.click(c.getByRole("button", { name: "Send message" }));
    await expect(
      c.findByText("Working", { exact: true }),
    ).resolves.toBeVisible();
    await expect(
      c.findByText("Pending", { exact: true }),
    ).resolves.toBeVisible();
    await waitFor(() =>
      expect(editor).not.toHaveTextContent(
        "Wait for my approval before continuing",
      ),
    );
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}{a}{/Control}{Backspace}");
    await userEvent.click(await c.findByRole("button", { name: "Stop agent" }));
    await waitFor(() => {
      const group = c.getAllByRole("group", { name: "Sent to" }).at(-1)!;
      expect(within(group).getByText("Unknown", { exact: true })).toBeVisible();
      expect(
        within(group).getByText("Cancelled", { exact: true }),
      ).toBeVisible();
    });
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      1,
    );
  },
};

export const SeparateApprovals: Story = {
  args: { scenario: "addressed-approval" },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement),
      editor = await c.findByRole("textbox", { name: "Message" });
    await waitFor(() =>
      expect(getComputedStyle(document.body).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(editor);
    for (const name of ["Reviewer", "Writer"]) {
      await userEvent.keyboard(`@${name.toLowerCase()}`);
      await userEvent.click(
        await within(canvasElement.ownerDocument.body).findByRole("option", {
          name: new RegExp(name),
        }),
      );
    }
    await userEvent.keyboard("Each participant must ask for approval");
    await userEvent.click(c.getByRole("button", { name: "Send message" }));
    for (let index = 0; index < 2; index++) {
      const allow = await c.findByRole("button", { name: /Allow once/ });
      await userEvent.click(allow);
      await waitFor(() => {
        const group = c.getAllByRole("group", { name: "Sent to" }).at(-1)!;
        expect(
          within(group).getAllByText("Completed", { exact: true }),
        ).toHaveLength(index + 1);
      });
    }
    await waitFor(() => {
      const saved = JSON.parse(aiReviewValue(canvasElement, "transcript"));
      expect(
        saved.filter((e: any) => e.type === "approval.response"),
      ).toHaveLength(2);
      expect(
        saved.filter(
          (e: any) =>
            e.type === "agent.delivery" && e.delivery.state === "completed",
        ),
      ).toHaveLength(2);
    });
    expect(JSON.parse(aiReviewValue(canvasElement, "sessions"))).toHaveLength(
      2,
    );
  },
};
