import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BackgroundDemo from "../../support/background/BackgroundDemo.svelte";
import { backgroundContext } from "../../support/background/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/Background work",
  component: BackgroundDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof BackgroundDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PendingWork: Story = {};
export const ResponsiveStartup: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = backgroundContext(canvasElement);
    const active = () =>
      fixture.app.notifications.activeProgress.map((item) => item.title);
    try {
      // Both commands and native repository preparation remain deliberately held.
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-notes-ready="true"]'),
          ).not.toBeNull(),
        { timeout: 30_000 },
      );
      await waitFor(() => expect(active()).toContain("Preparing AI commands"));
      await userEvent.click(
        canvas.getByRole("button", { name: "Repository History" }),
      );
      await waitFor(() => expect(active()).toContain("Loading JJ Log"));
      await userEvent.click(
        canvas.getByRole("button", {
          name: "Open command palette",
        }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await expect(
        await body.findByRole("combobox", { name: /command/i }),
      ).toBeVisible();
      await userEvent.keyboard("{Escape}");
      fixture.releaseCommands();
      fixture.releaseHistory();
      await expect(
        await canvas.findByRole("button", {
          name: /Keep repository history beside the notes/,
        }),
      ).toBeVisible();
      await waitFor(() =>
        expect(active()).not.toContain("Preparing AI commands"),
      );
      await waitFor(() => expect(active()).not.toContain("Loading JJ Log"));
    } finally {
      fixture.release();
    }
  },
};
export const ParserFailure: Story = {
  args: { failParsing: true },
  play: async ({ canvasElement }) => {
    const fixture = backgroundContext(canvasElement);
    try {
      fixture.release();
      const canvas = within(canvasElement);
      await expect(
        await canvas.findByText("Command parser worker failed"),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", {
          name: "Open command palette",
        }),
      ).toBeEnabled();
      await waitFor(() =>
        expect(
          fixture.app.notifications.activeProgress.some(
            (item) => item.title === "Preparing AI commands",
          ),
        ).toBe(false),
      );
    } finally {
      fixture.release();
    }
  },
};
