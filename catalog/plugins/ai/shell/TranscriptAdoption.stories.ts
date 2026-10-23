import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../../support/ai/shell/AiShellDemo.svelte";
import { shellFixture } from "../../../support/ai/shell/fixture.ts";
import { AiPlugin } from "../../../../src/components/ai/plugin/ai-plugin.ts";
import { cleanupCatalog } from "../../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Shell/Transcript adoption",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(root: HTMLElement) {
  const canvas = within(root);
  const fixture = shellFixture(root);
  await fixture.ready;
  const panel = await canvas.findByTestId("ai-chat-panel");
  await waitFor(() =>
    expect(panel).toHaveAttribute("data-initializing", "false"),
  );
  const plugin = fixture.app.plugins.plugins.get("ai");
  if (!(plugin instanceof AiPlugin)) throw new Error("Owned AI plugin missing");
  return { canvas, panel, fixture, plugin };
}
export const DocumentDefaultAndSavedClassic: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, panel, fixture, plugin } = await ready(canvasElement);
    await expect(
      within(panel).getByRole("button", { name: "Switch to Classic view" }),
    ).toBeVisible();
    const send = within(panel).getByRole("button", { name: /^Send message$/ });
    await expect(send.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      canvas.getByLabelText("Workspace status").getBoundingClientRect().top,
    );
    const editor = within(panel).getByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard("Keep this draft across presentation changes");
    await userEvent.click(
      within(panel).getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(editor).toBeInTheDocument();
    await expect(editor).toHaveTextContent(
      "Keep this draft across presentation changes",
    );
    await waitFor(async () =>
      expect(
        JSON.parse(await fixture.app.vault.adapter.read(".lapis/ai.json"))
          .settings.transcriptView,
      ).toBe("classic"),
    );
    fixture.app.workspace.getLeavesOfType("ai")[0]!.close();
    await plugin.application.operations.settle();
    await plugin.application.openAiConversation();
    const reopened = await canvas.findByTestId("ai-transcript-panel");
    await expect(
      within(reopened).getByRole("button", { name: "Switch to Document view" }),
    ).toBeVisible();
    const input = await within(reopened).findByRole("textbox", {
      name: /^Message$/,
    });
    await userEvent.click(input);
    await userEvent.keyboard("Summarize this note");
    await userEvent.click(
      canvas.getByRole("button", { name: /^Send message$/ }),
    );
    await expect(
      canvas.findByRole("textbox", { name: /^Assistant response$/ }),
    ).resolves.toHaveTextContent("Summary");
  },
};
export const PreferenceSaveFailure: Story = {
  play: async ({ canvasElement }) => {
    const { panel, plugin } = await ready(canvasElement);
    const original = plugin.saveData.bind(plugin);
    plugin.saveData = async () => {
      throw new Error("The vault is read-only");
    };
    try {
      await userEvent.click(
        within(panel).getByRole("button", { name: "Switch to Classic view" }),
      );
      await plugin.application.operations.settle();
      await expect(
        within(canvasElement.ownerDocument.body).findByText(
          "The vault is read-only",
        ),
      ).resolves.toBeVisible();
      expect(plugin.settings.get().transcriptView).toBe("document");
      expect(panel).not.toHaveTextContent("The vault is read-only");
    } finally {
      plugin.saveData = original;
    }
  },
};
