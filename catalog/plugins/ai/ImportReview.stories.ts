import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import ImportReviewDemo from "../../support/ai/imports/ImportReviewDemo.svelte";
const meta = {
  title: "Desktop/AI/Import review",
  component: ImportReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ImportReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function previewSession(element: HTMLElement) {
  const canvas = within(element);
  await userEvent.click(await canvas.findByRole("button", { name: "Notes" }));
  await userEvent.click(
    await canvas.findByRole("button", { name: /^Weekly review/ }),
  );
}
export const SelectAndPreview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await previewSession(canvasElement);
    await expect(
      canvas.findByRole("region", { name: "Captured conversation" }),
    ).resolves.toBeVisible();
    await expect(
      canvas.findByText("A focused weekly review"),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeEnabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(canvas.getByText("A focused weekly review")).toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Message" })).toBeNull();
  },
};
export const SaveAndDeduplicate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await previewSession(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Import snapshot" }),
    );
    await expect(
      canvas.findByText("Snapshot saved locally."),
    ).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Check saved snapshot" }),
    );
    await expect(
      canvas.findByText("This snapshot is already saved."),
    ).resolves.toBeVisible();
  },
};
export const InterruptedSave: Story = {
  args: { scenario: "save-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await previewSession(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Import snapshot" }),
    );
    await expect(
      page.findByText(
        "The local write acknowledgement was interrupted. Retry the same snapshot.",
      ),
    ).resolves.toBeVisible();
    await expect(canvas.getByText("A focused weekly review")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Import snapshot" }),
    );
    await expect(
      canvas.findByText("Snapshot saved locally."),
    ).resolves.toBeVisible();
    await waitFor(
      () =>
        expect(
          page.queryByText(
            "The local write acknowledgement was interrupted. Retry the same snapshot.",
          ),
        ).toBeNull(),
      { timeout: 12000 },
    );
  },
};
export const PreviewRecovery: Story = {
  args: { scenario: "failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await previewSession(canvasElement);
    await expect(
      page.findByText(
        "The selected source changed. Preview it again to read its current snapshot.",
      ),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Reload preview" }),
    );
    await expect(
      canvas.findByText("A focused weekly review"),
    ).resolves.toBeVisible();
    await waitFor(
      () =>
        expect(
          page.queryByText(
            "The selected source changed. Preview it again to read its current snapshot.",
          ),
        ).toBeNull(),
      { timeout: 12000 },
    );
  },
};
export const LoadingSources: Story = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).findByRole("status", {
        name: "Finding Codex folders",
      }),
    ).resolves.toBeVisible();
  },
};
export const NoSources: Story = { args: { scenario: "empty" } };
export const UnavailableHost: Story = { args: { scenario: "unavailable" } };

export const SavedReadOnlySnapshot: Story = {
  args: { scenario: "saved" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText("A focused weekly review"),
    ).resolves.toBeVisible();
    await expect(canvas.getByText("Read-only")).toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Message" })).toBeNull();
    await expect(
      canvas.queryByRole("button", { name: "Send message" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(canvas.getByText("A focused weekly review")).toBeVisible();
  },
};
