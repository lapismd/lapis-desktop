import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { openHistory } from "../../support/repository/interactions.ts";
const path =
  "Notes/.lapis/agents/sessions/7297795f-c00b-475e-b430-5b0e2e11a2e3/transcript.jsonl";
const meta = {
  title: "Desktop/Repository/Transcript history",
  component: RepositoryDemo,
  args: { scenario: "transcripts" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RepositoryDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const BackedUpLocalConversation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await userEvent.click(await canvas.findByRole("button", { name: path }));
    await expect(
      await canvas.findByRole("region", { name: `Changes to ${path}` }),
    ).toHaveTextContent("Your local conversation is backed up.");
  },
};
