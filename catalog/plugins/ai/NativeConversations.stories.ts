import type { Meta, StoryObj } from "@storybook/svelte-vite";
import NativeReaderDemo from "../../support/ai/native/NativeReaderDemo.svelte";
const meta = {
  title: "Desktop/AI/Native conversations",
  component: NativeReaderDemo,
  args: { scenario: "captured" },
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NativeReaderDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CapturedMessagesAndTools: Story = {};
export const ManagedAgentProfile: Story = { args: { scenario: "managed" } };
export const AuthoredThreadMessages: Story = { args: { scenario: "authored" } };
export const Loading: Story = { args: { scenario: "loading" } };
export const Empty: Story = { args: { scenario: "empty" } };
export const FailureAndRecovery: Story = { args: { scenario: "failure" } };
export const ReadFailureRetainsPreviousView: Story = {
  args: { scenario: "read-failure" },
};
