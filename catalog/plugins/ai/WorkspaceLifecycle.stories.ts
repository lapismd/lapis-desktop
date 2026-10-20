// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { aiWorkspaceFixture } from "../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Workspace lifecycle",
  component: AiWorkspaceDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
  args: { kind: "ai-chat" },
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function chat(element: HTMLElement) {
  const canvas = within(element);
  const panel = await canvas.findByTestId("ai-chat-panel");
  await waitFor(() =>
    expect(panel).toHaveAttribute("data-initializing", "false"),
  );
  return { canvas, panel, fixture: aiWorkspaceFixture(element) };
}
export const LazyStartAndFirstLocation: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, canvas, panel } = await chat(canvasElement);
    const inspect = async () => JSON.parse(await fixture.inspect());
    expect(await inspect()).toMatchObject({
      clients: 1,
      released: 0,
      sessions: [],
    });
    const input = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.type(
      input,
      "Keep this controller through the first durable location",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: /^Send message$/ }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Assistant response" }),
      ).toHaveTextContent("Keep this controller"),
    );
    const plugin = fixture.plugin()!;
    await plugin.application.operations.settle();
    expect(canvas.getByTestId("ai-chat-panel")).toBe(panel);
    expect(canvas.getByRole("textbox", { name: "Message" })).toBe(input);
    const sent = await inspect();
    expect(sent.sessions).toHaveLength(1);
    expect(sent.sessions[0].prompts).toEqual([
      "Keep this controller through the first durable location",
    ]);
    const former = plugin.application;
    expect(await fixture.app.plugins.disablePlugin("ai")).toBe(true);
    expect((await inspect()).released).toBe(1);
    expect(
      (await inspect()).sessions.every(
        (session: { closed: boolean }) => session.closed,
      ),
    ).toBe(true);
    expect(await fixture.app.plugins.enablePlugin("ai")).toBe(true);
    expect(plugin.application).not.toBe(former);
    await fixture.app.commands.executeCommand("ai:open-chat");
    await plugin.application.operations.settle();
    await chat(canvasElement);
    expect(await inspect()).toMatchObject({ clients: 2, released: 1 });
    expect(
      fixture.app.commands
        .getAllCommands()
        .filter((command) => command.id === "ai:open-chat"),
    ).toHaveLength(1);
  },
};
export const ExplicitConversationReplacement: Story = {
  args: { layout: "middle-top-tabs" },
  play: async ({ canvasElement }) => {
    const { fixture, canvas, panel } = await chat(canvasElement);
    const host = fixture.plugin()!.application;
    const entries = await host.conversations.listAll();
    const first = entries.find(
      (entry) => entry.metadata?.title === "Summarize project notes",
    )!;
    const second = entries.find(
      (entry) => entry.metadata?.title === "Fix parser errors",
    )!;
    const leaf = fixture.app.workspace.getLeavesOfType("ai")[0];
    await host.openAiConversation(first.location);
    expect(fixture.app.workspace.getLeavesOfType("ai")).toEqual([leaf]);
    expect(fixture.app.workspace.activeLeaf).toBe(leaf);
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-panel")).not.toBe(panel);
      expect(
        canvas.getByRole("textbox", { name: "Your message" }),
      ).toHaveTextContent("Summarize project notes");
    });
    const replacement = canvas.getByTestId("ai-chat-panel");
    await leaf.view.setState({ ...second.location });
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-panel")).not.toBe(replacement);
      expect(
        canvas.getByRole("textbox", { name: "Your message" }),
      ).toHaveTextContent("Fix parser errors");
    });
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
    await host.openAiConversation(second.location);
    const count = fixture.app.workspace.getLeavesOfType("ai").length;
    const active = fixture.app.workspace.activeLeaf;
    await host.openAiConversation(second.location);
    expect(fixture.app.workspace.getLeavesOfType("ai")).toHaveLength(count);
    expect(fixture.app.workspace.activeLeaf).toBe(active);
  },
};

export const LayoutDoesNotReloadModels: Story = {
  args: { layout: "right-sidebar" },
  play: async ({ canvasElement }) => {
    const { fixture, canvas, panel } = await chat(canvasElement);
    const initial = JSON.parse(await fixture.inspect()).modelRequests;
    const input = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.type(input, "Keep this draft while changing the layout");
    fixture.app.workspace.getBottomLeaf();
    await waitFor(() =>
      expect(
        canvas.getAllByRole("button", { name: "Close bottom panel" }).length,
      ).toBeGreaterThan(0),
    );
    await userEvent.click(
      canvas.getAllByRole("button", { name: "Close bottom panel" })[0]!,
    );
    const open = await canvas.findByRole("button", {
      name: "Open bottom panel",
    });
    await userEvent.click(open);
    await waitFor(() =>
      expect(
        canvas.getAllByRole("button", { name: "Close bottom panel" }).length,
      ).toBeGreaterThan(0),
    );
    await fixture.plugin()!.application.operations.settle();
    expect(canvas.getByTestId("ai-chat-panel")).toBe(panel);
    expect(input).toHaveTextContent(
      "Keep this draft while changing the layout",
    );
    expect(JSON.parse(await fixture.inspect()).modelRequests).toBe(initial);
  },
};
