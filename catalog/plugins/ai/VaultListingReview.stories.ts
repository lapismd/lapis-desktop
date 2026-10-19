import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../support/ai/shell/AiShellDemo.svelte";
import { shellFixture } from "../../support/ai/shell/fixture.ts";

const meta = {
  title: "Desktop/AI/Vault file exclusions",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { scenario: "registry-chat", reviewLayout: true, longMessages: true },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SharedCorePolicy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const { app } = shellFixture(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /^Change chat folder:/ }),
    );
    const picker = await page.findByLabelText("Chat folders");
    await waitFor(() => expect(picker).toHaveTextContent("Private"));
    const paths = within(picker)
      .getAllByRole("option")
      .map((item) => item.textContent!.trim());
    expect(paths.some((path) => /(^|\/)\.(git|jj)(\/|$)/u.test(path))).toBe(
      false,
    );
    expect(paths).toContain(".github");
    expect(app.plugins.plugins.has("repository-history")).toBe(false);
    const configuration = app.configuration.getConfiguration();
    expect(configuration.get("files.exclude")).toEqual([".git", ".jj"]);
    await userEvent.keyboard("{Escape}");
    await configuration.update("files.exclude", [".git", ".jj", "Private"]);
    await userEvent.click(
      canvas.getByRole("button", { name: /^Change chat folder:/ }),
    );
    const updated = await page.findByLabelText("Chat folders");
    await waitFor(() => expect(updated).not.toHaveTextContent("Private"));
    expect(await app.vault.adapter.read("Private/draft.md")).toBe(
      "# Private draft",
    );
  },
};
