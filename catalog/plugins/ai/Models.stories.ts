// SPDX-License-Identifier: Apache-2.0
import { aiReviewAction } from "../../support/ai/review.ts";
// Retained from lapis-plugins tree 56b5d6c1; ACP-only runtime choices.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, waitFor, within } from "storybook/test";
import AiChatDemo from "../../support/ai/AiChatDemo.svelte";
import {
  hoverHarnessControl,
  clickHarnessControl,
  dismissHarnessPreferences,
  waitForHarnessCatalog,
} from "../../support/ai/menu-interactions.ts";

const meta = {
  title: "Desktop/AI/Models",
  component: AiChatDemo,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiChatDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HarnessModelRefresh: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      showRuntimeSelection: true,
      loadModels: fn(async (agent: string, runtime: string) => [
        {
          provider: agent,
          model:
            agent === "opencode" ? "opencode-only-model" : "cursor-only-model",
          displayName:
            agent === "opencode"
              ? "OpenCode fixture model"
              : "Cursor fixture model",
          isDefault: true,
        },
      ]),
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const openPreferences = async () => {
      const trigger = await canvas.findByRole("button", {
        name: "Effort and model",
      });
      if (trigger.getAttribute("aria-expanded") !== "true") {
        await waitFor(() =>
          expect(
            getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
          ).not.toBe("none"),
        );
        await clickHarnessControl(trigger);
      }
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    };
    await openPreferences();
    await hoverHarnessControl(await body.findByTestId("ai-chat-agent"));
    await clickHarnessControl(
      await body.findByRole("menuitemradio", { name: "OpenCode ACP" }),
    );
    await dismissHarnessPreferences(canvasElement);
    await waitForHarnessCatalog(canvasElement, "opencode", "acp");
    await openPreferences();
    await hoverHarnessControl(await body.findByTestId("ai-chat-model"));
    await waitFor(() =>
      expect(body.getByTestId("ai-chat-model")).toHaveAttribute(
        "data-state",
        "open",
      ),
    );
    await expect(
      await body.findByRole("menuitemradio", {
        name: "OpenCode fixture model",
      }),
    ).toHaveAttribute("data-state", "checked");
    expect(
      body.queryByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toBeNull();
    await dismissHarnessPreferences(canvasElement);
    await openPreferences();
    await hoverHarnessControl(await body.findByTestId("ai-chat-agent"));
    await clickHarnessControl(
      await body.findByRole("menuitemradio", { name: "Cursor ACP" }),
    );
    await dismissHarnessPreferences(canvasElement);
    await waitForHarnessCatalog(canvasElement, "cursor", "acp");
    await openPreferences();
    await hoverHarnessControl(await body.findByTestId("ai-chat-model"));
    await waitFor(() =>
      expect(body.getByTestId("ai-chat-model")).toHaveAttribute(
        "data-state",
        "open",
      ),
    );
    await expect(
      await body.findByRole("menuitemradio", { name: "Cursor fixture model" }),
    ).toHaveAttribute("data-state", "checked");
    expect(
      body.queryByRole("menuitemradio", { name: "OpenCode fixture model" }),
    ).toBeNull();
    await dismissHarnessPreferences(canvasElement);
  },
};

export const SettingsHarnessModelRefresh: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      showRuntimeSelection: true,
      loadModels: async (agent: string) => [
        {
          provider: agent,
          model: "cursor-settings-model",
          displayName: "Cursor settings model",
          isDefault: true,
        },
      ],
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await aiReviewAction(canvasElement, "Choose Cursor in Settings");
    await waitForHarnessCatalog(canvasElement, "cursor", "acp");
    await clickHarnessControl(
      canvas.getByRole("button", { name: "Effort and model" }),
    );
    await hoverHarnessControl(await body.findByTestId("ai-chat-model"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Cursor settings model" }),
    ).toHaveAttribute("data-state", "checked");
    expect(
      body.queryByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toBeNull();
    await dismissHarnessPreferences(canvasElement);
  },
};

export const LapisAgentPicker: Story = {
  args: {
    showRuntimeSelection: true,
    loadModels: async (agent: string) => [
      { provider: agent, model: "qwen3.8-max", isDefault: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const open = async () => {
      await clickHarnessControl(
        await canvas.findByRole("button", { name: "Effort and model" }),
      );
    };
    await open();
    await hoverHarnessControl(await body.findByTestId("ai-chat-agent"));
    for (const name of ["Codex ACP", "Cursor ACP", "OpenCode ACP", "Lapis AI"])
      await waitFor(() =>
        expect(body.getByRole("menuitemradio", { name })).toBeVisible(),
      );
    await clickHarnessControl(
      body.getByRole("menuitemradio", { name: "Lapis AI" }),
    );
    await dismissHarnessPreferences(canvasElement);
    await waitForHarnessCatalog(canvasElement, "local", "acp");
    await open();
    await hoverHarnessControl(await body.findByTestId("ai-chat-model"));
    await expect(
      await body.findByRole("menuitemradio", { name: "qwen3.8-max" }),
    ).toHaveAttribute("data-state", "checked");
    await dismissHarnessPreferences(canvasElement);
    await open();
    await hoverHarnessControl(await body.findByTestId("ai-chat-agent"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Lapis AI" }),
    ).toHaveAttribute("aria-checked", "true");
    await dismissHarnessPreferences(canvasElement);
  },
};
