import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import CaptureLayoutDemo from "../../support/ai/sessions/CaptureLayoutDemo.svelte";
const meta = {
  title: "Desktop/AI/Session layout review",
  component: CaptureLayoutDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CaptureLayoutDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CapturedHistory: Story = {};
export const ReadOnlyControls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("button", { name: "Switch to Classic view" }),
    ).resolves.toBeVisible();
    await expect(canvas.queryByText("[object Object]")).toBeNull();
    await expect(
      canvas.queryByRole("button", { name: /^Comment on/ }),
    ).toBeNull();
    await waitFor(() => {
      const listFooter = canvasElement
        .querySelector(".ai-session-list-footer")
        ?.getBoundingClientRect();
      const bodyFooter = canvasElement
        .querySelector(".ai-session-footer")
        ?.getBoundingClientRect();
      if (listFooter?.width && bodyFooter) {
        expect(bodyFooter.height).toBe(listFooter.height);
        expect(Math.abs(bodyFooter.top - listFooter.top)).toBeLessThan(1);
      }
    });
    await expect(canvas.queryByRole("button", { name: "Document" })).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.findByRole("button", { name: "Switch to Document view" }),
    ).resolves.toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /^Comment on/ }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Document view" }),
    );
    await expect(
      canvas.findByRole("button", { name: "Switch to Classic view" }),
    ).resolves.toBeVisible();
  },
};
export const VersionSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await expect(canvas.findByText("License added")).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: /Choose captured version/ }),
    );
    await userEvent.click(
      await page.findByRole("option", { name: "Preview version 1" }),
    );
    await expect(
      canvas.findByText("This is local captured version 1."),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.getByText("This is local captured version 1."),
    ).toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Message" })).toBeNull();
  },
};
export const SearchSessions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole("button", {
      name: "Toggle captured sessions",
    });
    if (toggle.getAttribute("aria-pressed") === "false")
      await userEvent.click(toggle);
    await userEvent.click(
      canvas.getByRole("button", { name: "Search captured sessions" }),
    );
    const input = canvas.getByRole("searchbox", {
      name: "Search captured sessions",
    });
    await userEvent.type(input, "MIT");
    await expect(
      canvas.getByRole("button", { name: /^Open Add MIT license/ }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: /^Open Research note links/ }),
    ).toBeNull();
    await userEvent.type(input, " no result");
    await expect(canvas.getByText("No matching sessions")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.getByRole("button", { name: /^Open Research note links/ }),
    ).toBeVisible();
  },
};
export const IncompleteVersion: Story = {
  args: { scenario: "incomplete" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Choose captured version/ }),
    );
    await userEvent.click(
      await page.findByRole("option", {
        name: "Preview version 3 (incomplete)",
      }),
    );
    await expect(
      canvas.findByText("Incomplete local version"),
    ).resolves.toBeVisible();
    await expect(
      canvas.queryByRole("region", { name: "Captured conversation" }),
    ).toBeNull();
  },
};
export const LoadingHistory: Story = { args: { scenario: "loading" } };
export const EmptyHistory: Story = { args: { scenario: "empty" } };
export const SavedLocalVersions: Story = {
  args: { scenario: "persisted" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await expect(
      canvas.findByText("This is local captured version 3."),
    ).resolves.toBeVisible();
    await userEvent.click(
      await canvas.findByRole("button", { name: "Choose captured version 3" }),
    );
    await userEvent.click(
      await page.findByRole("option", { name: "Preview version 1" }),
    );
    await expect(
      canvas.findByText("This is local captured version 1."),
    ).resolves.toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Message" })).toBeNull();
    await expect(
      canvas.queryByRole("button", { name: /^Comment on/ }),
    ).toBeNull();
  },
};
export const SavedVersionReadFailure: Story = {
  args: { scenario: "read-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await expect(
      canvas.findByText("This is local captured version 3."),
    ).resolves.toBeVisible();
    const selectOlder = async () => {
      await userEvent.click(
        await canvas.findByRole("button", {
          name: "Choose captured version 3",
        }),
      );
      await userEvent.click(
        await page.findByRole("option", { name: "Preview version 1" }),
      );
    };
    await selectOlder();
    await expect(
      page.findByText(
        "The saved version could not be read. Its current preview is retained.",
      ),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByText("This is local captured version 3."),
    ).toBeVisible();
    await selectOlder();
    await expect(
      canvas.findByText("This is local captured version 1."),
    ).resolves.toBeVisible();
    await waitFor(
      () =>
        expect(
          page.queryByText(
            "The saved version could not be read. Its current preview is retained.",
          ),
        ).toBeNull(),
      { timeout: 12000 },
    );
  },
};
