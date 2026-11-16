import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeRemotesDemo from "../../support/repository/NativeRemotesDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { nativeRemotesFor } from "../../support/repository/native-remotes.ts";
const meta = {
  title: "Desktop/Repository remotes",
  component: NativeRemotesDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof NativeRemotesDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function settings(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole(
      "button",
      { name: /Working copy details:/ },
      { timeout: 30_000 },
    ),
  );
  const details = within(
    await within(canvasElement.ownerDocument.body).findByRole("region", {
      name: "Working copy details",
    }),
  );
  await userEvent.click(
    details.getByRole("button", {
      name: "Manage remotes for original repository",
    }),
  );
  await expect(
    await canvas.findByRole("heading", { name: "Remotes and credentials" }),
  ).toBeVisible();
  return canvas;
}

export const WorkingCopyAndReview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const footer = within(
      await canvas.findByRole(
        "contentinfo",
        { name: "Workspace status" },
        { timeout: 30_000 },
      ),
    );
    await userEvent.click(
      await footer.findByRole("button", { name: "Expand repository status" }),
    );
    await expect(footer.getByText("Saved locally")).toBeVisible();
    await userEvent.click(
      footer.getByRole("button", { name: /Working copy details:/ }),
    );
    const details = within(
      await within(canvasElement.ownerDocument.body).findByRole("region", {
        name: "Working copy details",
      }),
    );
    await userEvent.click(
      details.getByRole("button", {
        name: /Review push to original repository/,
      }),
    );
    const reviewDialog = await within(
      canvasElement.ownerDocument.body,
    ).findByRole("dialog", { name: "Push to original repository?" });
    const review = within(reviewDialog);
    await waitFor(() =>
      expect(
        review.getByText(/git.example.test\/team\/original.git/),
      ).toBeVisible(),
    );
    await userEvent.click(review.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(reviewDialog).not.toBeInTheDocument());
  },
};
export const MissingConnection: Story = {
  args: { scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const canvas = await settings(canvasElement);
    await expect(
      canvas.getByRole("region", { name: "Original repository" }),
    ).toBeVisible();
    await expect(
      canvas.getByText(/this computer’s OS credential store/),
    ).toBeVisible();
    await expect(nativeRemotesFor(canvasElement).commands).toEqual([]);
  },
};
export const LockedStorageWithHostSsh: Story = {
  args: { scenario: "locked" },
  play: async ({ canvasElement }) => {
    const canvas = await settings(canvasElement);
    await expect(canvas.getAllByText(/locked/i)[0]).toBeVisible();
    await expect(
      within(
        canvas.getByRole("region", { name: "Original repository" }),
      ).getByRole("button", { name: /Fetch/ }),
    ).toBeEnabled();
  },
};
export const GithubCodeHandoff: Story = {
  args: { scenario: "github" },
  play: async ({ canvasElement }) => {
    const canvas = await settings(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Sign in to GitHub" }),
    );
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog", {
        name: "Sign in to GitHub",
      }),
    );
    await userEvent.click(
      dialog.getByRole("button", { name: "Copy code and open GitHub" }),
    );
    await waitFor(() =>
      expect(nativeRemotesFor(canvasElement).handoffs).toEqual([
        "copy:CURRENT-CODE",
        "open:https://github.com/login/device",
      ]),
    );
  },
};
