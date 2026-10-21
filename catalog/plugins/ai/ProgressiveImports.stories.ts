import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ProgressiveImportDemo from "../../support/ai/progressive-imports/ProgressiveImportDemo.svelte";
import { aiReviewAction, aiReviewValue } from "../../support/ai/review.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta = {
  title: "Desktop/AI/Progressive imports",
  component: ProgressiveImportDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProgressiveImportDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function showSources(element: HTMLElement) {
  const canvas = within(element);
  const toggle = canvas.queryByRole("button", {
    name: "Toggle import sources",
  });
  if (toggle?.getAttribute("aria-pressed") === "false")
    await userEvent.click(toggle);
  return canvas.findByRole("button", { name: /^Codex.*CLI.*Desktop/ });
}
async function showPreview(element: HTMLElement) {
  const canvas = within(element);
  const button = canvas.queryByRole("button", { name: "Show preview" });
  if (button) await userEvent.click(button);
}

export const BrowseByHarnessAndFolder: Story = {
  args: { automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("button", { name: /^Codex.*CLI.*Desktop/ }),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "loads")).toBe("0");
    expect(aiReviewValue(canvasElement, "reads")).toBe("0");
    await expect(
      canvas.getByRole("button", { name: "Cursor Not available" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "OpenCode Not available" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Lapis Notes" }),
    );
    await expect(canvas.getByText("Loading folder sessions…")).toBeVisible();
    expect(
      canvas.queryByRole("button", { name: /Weekly review and follow-ups/ }),
    ).toBeNull();
    await aiReviewAction(canvasElement, "finish-folder");
    expect(aiReviewValue(canvasElement, "loads")).toBe("1");
    expect(aiReviewValue(canvasElement, "reads")).toBe("0");
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Weekly review and follow-ups/,
      }),
    );
    await expect(
      canvas.findByText(
        "I'll start with the decisions and open questions, then collect the next actions.",
      ),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "entries")).toBe("2");
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeDisabled();
    await aiReviewAction(canvasElement, "next-batch");
    expect(aiReviewValue(canvasElement, "entries")).toBe("3");
    await aiReviewAction(canvasElement, "complete");
    await expect(
      canvas.findByRole("button", { name: "Import snapshot" }),
    ).resolves.toBeEnabled();
  },
};
export const StreamingPreview: Story = {
  args: { scenario: "streaming" },
};
export const PauseAndComplete: Story = {
  args: { scenario: "streaming", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("progressbar", { name: "Transcript loading progress" }),
    ).resolves.toHaveAttribute("aria-valuenow", "33");
    await userEvent.click(
      canvas.getByRole("button", { name: "Pause transcript loading" }),
    );
    await expect(canvas.findByText("Reading paused")).resolves.toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Resume transcript loading" }),
    );
    await aiReviewAction(canvasElement, "complete");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(aiReviewValue(canvasElement, "entries")).toBe("6");
    await expect(
      canvas.getByRole("button", { name: "Switch to Document view" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Import snapshot" }),
    );
    await expect(
      canvas.findByText("Snapshot saved locally."),
    ).resolves.toBeVisible();
    expect(canvas.queryByRole("textbox", { name: "Message" })).toBeNull();
  },
};
export const CachedFolderAndPreview: Story = {
  args: { scenario: "cached", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText("Cached preview")).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "reads")).toBe("0");
    await showSources(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Refresh selected folder" }),
    );
    await expect(canvas.getByText("Checking cached sessions…")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Weekly review and follow-ups/ }),
    ).toBeVisible();
    await aiReviewAction(canvasElement, "finish-folder");
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Lapis Notes" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Lapis Notes" }),
    );
    expect(aiReviewValue(canvasElement, "loads")).toBe("1");
    await userEvent.click(
      canvas.getByRole("button", { name: /Weekly review and follow-ups/ }),
    );
    expect(aiReviewValue(canvasElement, "reads")).toBe("0");
    await showSources(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Design Core" }),
    );
    await expect(canvas.getByText("Loading folder sessions…")).toBeVisible();
    await showPreview(canvasElement);
    await expect(
      canvas.getByText(
        "Codex CLI · ~/Projects/lapis-notes · Read-only preview",
      ),
    ).toBeVisible();
    await showSources(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Lapis Notes" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Projects/Lapis Notes" }),
    );
    await expect(canvas.getByText("3 sessions · Cached")).toBeVisible();
    expect(canvas.queryByText("Loading folder sessions…")).toBeNull();
    expect(aiReviewValue(canvasElement, "loads")).toBe("2");
  },
};
export const SwitchDuringRead: Story = {
  args: { scenario: "streaming", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("button", { name: "Pause transcript loading" });
    await showSources(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Connect the research notes/ }),
    );
    expect(aiReviewValue(canvasElement, "cancelled")).toBe("1");
    await aiReviewAction(canvasElement, "late-batch");
    expect(aiReviewValue(canvasElement, "entries")).toBe("2");
    await expect(
      canvas.findByText(
        "Review the captured work: Connect the research notes.",
      ),
    ).resolves.toBeVisible();
    expect(
      canvas.queryByText(
        "Help me review this week's notes and organise the follow-ups.",
      ),
    ).toBeNull();
    await aiReviewAction(canvasElement, "complete");
  },
};
export const SourceChanged: Story = {
  args: { scenario: "changed", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText(
        "The source changed. Reload to verify the current snapshot.",
      ),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Reload preview" }),
    );
    await waitFor(() =>
      expect(aiReviewValue(canvasElement, "phase")).toBe("reading"),
    );
    await aiReviewAction(canvasElement, "complete");
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeEnabled();
  },
};
export const EmptyFolder: Story = {
  args: { scenario: "empty", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByText("No sessions in this folder."),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "reads")).toBe("0");
    await showPreview(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Import snapshot" }),
    ).toBeDisabled();
  },
};
export const DiscoveringFolders: Story = {
  args: { scenario: "indexing", automatic: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("status", { name: "Finding project folders" }),
    ).resolves.toBeVisible();
    expect(aiReviewValue(canvasElement, "loads")).toBe("0");
    await aiReviewAction(canvasElement, "finish-index");
    await expect(
      canvas.findByRole("button", { name: "Projects/Lapis Notes" }),
    ).resolves.toBeVisible();
  },
};
