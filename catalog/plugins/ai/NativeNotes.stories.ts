import {
  findMessageEditor,
  messageEditor,
} from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import NativeNotesDemo from "../../support/ai/NativeNotesDemo.svelte";
import { nativeNotesFixture } from "../../support/ai/native-notes.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Native Notes binding",
  component: NativeNotesDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof NativeNotesDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LayoutKeepsModelDiscovery: Story = {
  args: { scenario: "available" },
  play: async ({ canvasElement }) => {
    const f = await ready(canvasElement),
      canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Open Chat$/ }));
    const input = await findMessageEditor(canvas);
    await waitFor(() => expect(input).toBeEnabled());
    await waitFor(() => expect(f.probes).toBe(1));
    await userEvent.type(
      input,
      "Retain this draft across bottom panel changes",
    );
    const requests = f.modelRequests;
    f.app!.workspace.getBottomLeaf();
    await waitFor(() =>
      expect(
        canvas.getAllByRole("button", { name: "Close bottom panel" }).length,
      ).toBeGreaterThan(0),
    );
    const close = canvas.queryAllByRole("button", {
      name: "Close bottom panel",
    });
    if (close[0]) await userEvent.click(close[0]);
    const open = await canvas.findByRole("button", {
      name: "Open bottom panel",
    });
    await userEvent.click(open);
    await waitFor(() =>
      expect(
        canvas.getAllByRole("button", { name: "Close bottom panel" }).length,
      ).toBeGreaterThan(0),
    );
    expect(messageEditor(canvas)).toBe(input);
    expect(input).toHaveTextContent(
      "Retain this draft across bottom panel changes",
    );
    expect(f.factories).toBe(1);
    expect(f.modelRequests).toBe(requests);
    expect(f.probes).toBe(1);
  },
};
async function ready(canvasElement: HTMLElement) {
  await waitFor(
    () =>
      expect(
        canvasElement.querySelector('[data-notes-ready="true"]'),
      ).not.toBeNull(),
    { timeout: 30000 },
  );
  return nativeNotesFixture(canvasElement);
}
export const UnavailableAgent: Story = {
  play: async ({ canvasElement }) => {
    const fixture = await ready(canvasElement);
    expect(fixture.factories).toBe(1);
    const app = fixture.app!;
    expect(app.workspaceTrust.trusted).toBe(true);
    expect(app.plugins.plugins.get("ai")?.enabled).toBe(true);
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: /^Open Chat$/,
      }),
    );
    const plugin = app.plugins.plugins.get(
      "ai",
    ) as import("../../../src/components/ai/plugin/ai-plugin.ts").AiPlugin;
    await plugin.application.operations.settle();
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-testid="ai-chat-panel"]'),
        JSON.stringify({
          notifications: app.notifications.list().map((item) => item.message),
          leaves: app.workspace
            .getLeavesOfType("ai")
            .map((leaf) => leaf.view.getViewType()),
        }),
      ).not.toBeNull(),
    );
    await waitFor(() =>
      expect(within(canvasElement).getByTestId("ai-chat-panel")).toBeVisible(),
    );
    await waitFor(() => expect(fixture.allocations).toBe(1));
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent("Configure an admitted agent"),
    );
    expect(
      fixture.calls.filter((call) => call.command === "desktop_ai_admit"),
    ).toHaveLength(1);
    expect(fixture.files.size).toBeGreaterThan(0);
    await app.commands.executeCommand("ai:open-catalog");
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-testid="ai-catalog"]'),
      ).not.toBeNull(),
    );
  },
};
function inactive(scenario: "disabled" | "safe-mode"): Story {
  return {
    args: { scenario },
    play: async ({ canvasElement }) => {
      const fixture = await ready(canvasElement);
      expect(fixture.factories).toBe(0);
      expect(fixture.allocations).toBe(0);
      expect(fixture.calls).toEqual([]);
      expect(fixture.files.size).toBe(0);
    },
  };
}
export const Disabled = inactive("disabled");
export const SafeMode = inactive("safe-mode");
export const Untrusted: Story = {
  play: async ({ canvasElement }) => {
    const fixture = await ready(canvasElement);
    await fixture.app!.workspaceTrust.revoke();
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: /^Open Chat$/ }),
    );
    await waitFor(() =>
      expect(canvasElement).toHaveTextContent(
        "AI is disabled in this workspace",
      ),
    );
    expect(fixture.app!.plugins.plugins.get("ai")?.enabled).toBe(true);
    expect(fixture.allocations).toBe(0);
    expect(
      fixture.calls.filter((call) => call.command === "desktop_ai_admit"),
    ).toEqual([]);
  },
};
