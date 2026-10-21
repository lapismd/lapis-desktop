import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
const meta = {
  title: "Desktop/AI compute library",
  component: SettingsDemo,
  args: { scenario: "setup-downloaded" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const DownloadedModels: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const library = within(
      await canvas.findByRole("region", { name: "Downloaded models" }),
    );
    await expect(library.getByText("396.7 MB")).toBeVisible();
    await expect(
      library.getByText("Downloaded", { exact: true }),
    ).toBeVisible();
    expect(aiReviewValue(canvasElement, "Compute commands")).toBe("[]");
    await userEvent.click(library.getByRole("button", { name: /^Start / }));
    await waitFor(() =>
      expect(library.getByText("Running", { exact: true })).toBeVisible(),
    );
    await userEvent.click(library.getByRole("button", { name: /^Stop / }));
    await waitFor(() =>
      expect(library.queryByText("Running", { exact: true })).toBeNull(),
    );
  },
};
export const DownloadProgress: Story = {
  args: { scenario: "setup-downloading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("progressbar", {
        name: "Current file download progress",
      }),
    ).toHaveAttribute("aria-valuenow", "50");
    await expect(
      canvas.getByText("198.4 MB of 396.7 MB · current file"),
    ).toBeVisible();
  },
};
export const UnknownTotal: Story = {
  args: { scenario: "setup-preparing" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Preparing runtime", { exact: true }),
    ).toBeVisible();
    await expect(canvas.getByText("In progress")).toBeVisible();
    expect(canvas.queryByRole("progressbar")).toBeNull();
  },
};
export const MissingWeights: Story = {
  args: { scenario: "setup-missing" },
  play: async ({ canvasElement }) => {
    const library = within(
      await within(canvasElement).findByRole("region", {
        name: "Downloaded models",
      }),
    );
    await expect(library.getByText("Files missing")).toBeVisible();
    await expect(
      library.getByRole("button", { name: /^Start / }),
    ).toBeDisabled();
  },
};
export const RemoveDownloadedModel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Remove Qwen/ }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("alertdialog"),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("alertdialog"),
      ).toBeNull(),
    );
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
    expect(aiReviewValue(canvasElement, "Compute commands")).toBe("[]");
    await userEvent.click(canvas.getByRole("button", { name: /^Remove Qwen/ }));
    await userEvent.click(
      within(
        await within(canvasElement.ownerDocument.body).findByRole(
          "alertdialog",
        ),
      ).getByRole("button", { name: "Remove weights" }),
    );
    await expect(await canvas.findByText("No downloaded models")).toBeVisible();
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).queryByRole("alertdialog"),
      ).toBeNull(),
    );
    await waitFor(() =>
      expect(
        getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
      ).not.toBe("none"),
    );
  },
};
export const RecoverableFailure: Story = {
  args: { scenario: "setup-compute-failed" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const download = await canvas.findByRole("button", {
      name: "Download model",
    });
    await userEvent.click(download);
    await waitFor(() => expect(download).toBeEnabled());
    await aiReviewAction(canvasElement, "Inspect saved settings");
    expect(aiReviewValue(canvasElement, "AI notifications")).toContain(
      "Check the model reference and network connection",
    );
    await expect(
      canvas.getByText(
        "Last operation failed. Check the notification for recovery details.",
      ),
    ).toBeVisible();
  },
};
export const InterruptedOperation: Story = {
  args: { scenario: "setup-compute-unknown" },
};

export const ModelTable: Story = {
  args: { scenario: "setup-model-table" },
  play: async ({ canvasElement }) => {
    const library = within(
      await within(canvasElement).findByRole("region", {
        name: "Downloaded models",
      }),
    );
    await expect(library.getByText("Qwen3 0.6B · Q4_K_M")).toBeVisible();
    await expect(library.getByText("Local assistant.gguf")).toBeVisible();
    await expect(library.getByText("1.20 GB")).toBeVisible();
    expect(aiReviewValue(canvasElement, "Compute commands")).toBe("[]");
  },
};
