import { cleanupCatalog } from "../../support/lifecycle.ts";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
const meta = {
  title: "Desktop/AI/Agent profiles",
  beforeEach: () => cleanupCatalog,
  component: SettingsDemo,
  args: { scenario: "profiles" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SavedAgents: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "Edit Reviewer" });
    expect(canvas.queryByRole("heading", { name: "Your agents" })).toBeNull();
  },
};
export const NoSavedAgents: Story = { args: { scenario: "profiles-empty" } };

export const FailureAndRecovery: Story = {
  args: { scenario: "profiles-failure" },
};

export const ContextAndPermissions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Edit Reviewer" }),
    );
    const dialog = within(await body.findByRole("dialog"));
    expect(
      dialog.getByRole("textbox", { name: "Agent instructions" }),
    ).toHaveTextContent(
      "Keep the author’s examples. Explain proposed changes before editing.",
    );
    const description = dialog.getByRole("textbox", { name: /Description/ });
    await userEvent.click(description);
    await userEvent.keyboard(
      /Mac/u.test(navigator.platform)
        ? "{Meta>}a{/Meta}{Backspace}"
        : "{Control>}a{/Control}{Backspace}",
    );
    await userEvent.type(description, "Reviews the whole notebook");
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Permissions" })).toBeEnabled(),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Permissions" }));
    await userEvent.click(
      await body.findByRole("option", { name: "Workspace edits" }),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Save agent" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await aiReviewAction(canvasElement, "Inspect saved settings");
    const saved = JSON.parse(aiReviewValue(canvasElement, "Saved AI data"));
    expect(saved.settings.agentParticipants[0]).toMatchObject({
      description: "Reviews the whole notebook",
      executionMode: "fixture-edit",
      instructions:
        "Keep the author’s examples. Explain proposed changes before editing.",
    });
    const card = canvas.getByRole("button", {
      name: "Edit Reviewer",
    }).parentElement!;
    expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(209);
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Edit Reviewer" }),
    );
  },
};

export const InvalidContextRetainsDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Edit Reviewer" }),
    );
    const dialog = within(await body.findByRole("dialog"));
    const description = dialog.getByRole("textbox", { name: "Description" });
    await userEvent.click(description);
    await userEvent.keyboard(
      /Mac/u.test(navigator.platform)
        ? "{Meta>}a{/Meta}{Backspace}"
        : "{Control>}a{/Control}{Backspace}",
    );
    await userEvent.type(description, "a".repeat(281));
    await userEvent.click(dialog.getByRole("button", { name: "Save agent" }));
    await waitFor(async () => {
      await aiReviewAction(canvasElement, "Inspect saved settings");
      expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
        "Invalid agent description",
      );
    });
    expect(description).toHaveTextContent("a".repeat(281));
    expect(body.getByRole("dialog")).toBeVisible();
    expect(
      JSON.parse(aiReviewValue(canvasElement, "Saved AI data")).settings
        .agentParticipants[0].description,
    ).toBe("Reviews notes for accuracy and clarity");
  },
};
