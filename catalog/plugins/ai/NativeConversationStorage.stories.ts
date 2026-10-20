import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingsDemo from "../../support/ai/SettingsDemo.svelte";
const meta = {
  title: "Desktop/AI/Native conversation storage",
  component: SettingsDemo,
  args: { scenario: "native" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SettingsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NormalSessionsRemainDefault: Story = {};
export const NativeHistoryEnabled: Story = {
  args: { scenario: "native-enabled" },
};
export const Loading: Story = { args: { scenario: "native-loading" } };
export const FailureAndRecovery: Story = {
  args: { scenario: "native-failure" },
};
export const UncertainChoice: Story = {
  args: { scenario: "native-uncertain-choice" },
};
export const UncertainCreation: Story = {
  args: { scenario: "native-uncertain-creation" },
};
export const Unavailable: Story = { args: { scenario: "native-unavailable" } };
