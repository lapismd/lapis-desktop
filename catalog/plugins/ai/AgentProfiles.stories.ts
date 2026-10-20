import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
const meta = {
  title: "Desktop/AI/Agent profiles",
  component: SettingsDemo,
  args: { scenario: "profiles" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SavedAgents: Story = {};
export const NoSavedAgents: Story = { args: { scenario: "profiles-empty" } };

export const FailureAndRecovery: Story = {
  args: { scenario: "profiles-failure" },
};
