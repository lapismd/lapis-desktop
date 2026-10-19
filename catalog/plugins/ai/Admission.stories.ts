// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import {
  aiWorkspaceFixture,
  type AiWorkspaceScenario,
} from "../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
const meta = {
  title: "Desktop/AI/Admission",
  component: AiWorkspaceDemo,
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(element: HTMLElement) {
  await waitFor(() =>
    expect(within(element).getByTestId("ai-workspace-demo")).toHaveAttribute(
      "data-status",
      "ready",
    ),
  );
  const fixture = aiWorkspaceFixture(element);
  await fixture.ready;
  return fixture;
}
function disabled(scenario: AiWorkspaceScenario): Story {
  return {
    args: { scenario },
    play: async ({ canvasElement }) => {
      const fixture = await ready(canvasElement);
      expect(JSON.parse(await fixture.inspect())).toMatchObject({
        clients: 0,
        released: 0,
        loaded: false,
        sessions: [],
      });
      expect(
        fixture.app.commands
          .getAllCommands()
          .filter((command) => command.id.startsWith("ai:")),
      ).toEqual([]);
      expect(within(canvasElement).queryByTestId("ai-chat-panel")).toBeNull();
      expect(
        await fixture.app.vault.adapter.exists(
          "Notes/.lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000/transcript.jsonl",
        ),
      ).toBe(true);
    },
  };
}
export const Disabled = disabled("disabled");
export const SafeMode = disabled("safe-mode");
export const InstalledDisabled = disabled("installed-disabled");
export const InstalledCopyPrecedence: Story = {
  args: { scenario: "installed-copy" },
  play: async ({ canvasElement }) => {
    const fixture = await ready(canvasElement);
    const plugin = fixture.plugin()!;
    expect(plugin.manifest.name).toBe("AI");
    expect(JSON.parse(await fixture.inspect())).toMatchObject({
      clients: 1,
      sessions: [],
      settings: { thinking: "high" },
      data: { retainedExtra: true },
    });
    for (const id of ["ai:open-chat", "ai:open-history", "ai:open-catalog"])
      expect(
        fixture.app.commands
          .getAllCommands()
          .filter((command) => command.id === id),
      ).toHaveLength(1);
    expect(
      JSON.parse(
        await fixture.app.vault.adapter.read(".lapis/plugins/ai/data.json"),
      ),
    ).toEqual({
      settings: { defaultRuntime: "acp", thinking: "high" },
      retainedExtra: true,
    });
  },
};
export const UnavailableAdmission: Story = {
  args: { kind: "ai-chat", scenario: "unavailable" },
  play: async ({ canvasElement }) => {
    const fixture = await ready(canvasElement);
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    expect(
      within(panel).getByText("Fixture native AI is unavailable"),
    ).toBeVisible();
    await userEvent.type(
      within(panel).getByRole("textbox", { name: "Message" }),
      "Cannot execute without admission",
    );
    await userEvent.click(
      within(panel).getByRole("button", { name: "Send message" }),
    );
    await fixture.plugin()!.application.operations.settle();
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
    const errors = within(panel).getAllByText(
      "Fixture native AI is unavailable",
    );
    expect(errors).toHaveLength(1);
    expect(within(panel).getAllByRole("alert")).toHaveLength(1);
    for (const error of errors) expect(error).toBeVisible();
  },
};
