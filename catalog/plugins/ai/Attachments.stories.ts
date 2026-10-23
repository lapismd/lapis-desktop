import { messageEditor } from "../../support/ai/message-editor.ts";
// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { shellFixture } from "../../support/ai/shell/fixture.ts";
import AiShellDemo from "../../support/ai/shell/AiShellDemo.svelte";

const meta = {
  title: "Desktop/AI/Attachments",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { scenario: "registry-chat", reviewLayout: true },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(element: HTMLElement) {
  await shellFixture(element).ready;
  const canvas = within(element),
    page = within(element.ownerDocument.body);
  await waitFor(() =>
    expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-initializing",
      "false",
    ),
  );
  return { canvas, page };
}
async function attach(element: HTMLElement, name: string) {
  const { canvas, page } = await ready(element);
  await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
  await userEvent.click(
    await page.findByRole("option", { name: new RegExp(name) }),
  );
}
async function pathTooltip(trigger: HTMLElement, path: string) {
  await waitFor(() => expect(trigger).toHaveAccessibleDescription(path));
  const id = trigger.getAttribute("aria-describedby")!;
  const tooltip = trigger.ownerDocument.getElementById(id)!;
  expect(tooltip).toBeVisible();
  expect(tooltip).toHaveTextContent(path);
}
export const Classic: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await ready(canvasElement);
    const toggle = canvas.queryByRole("button", {
      name: "Switch to Classic view",
    });
    if (toggle) await userEvent.click(toggle);
    await attach(canvasElement, "Welcome");
    const drawer = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="ai-chat-composer-drawer"]',
    )!;
    const composer = canvasElement.querySelector(
      '[data-ui-component="ai-chat-composer"]',
    )!;
    expect(drawer.closest('[data-ui-component="ai-chat-composer"]')).toBe(
      composer,
    );
    const body = composer.querySelector<HTMLElement>(
      ':scope > [data-ui-part="body"]',
    )!;
    expect(body.getBoundingClientRect().top).toBeLessThan(
      drawer.getBoundingClientRect().bottom,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Collapse Attachments" }),
    );
    expect(
      body.getBoundingClientRect().top - drawer.getBoundingClientRect().top,
    ).toBeLessThanOrEqual(36);
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Attachments" }),
    );
    expect(
      canvas.getByRole("button", { name: "Remove Welcome" }),
    ).toBeVisible();
  },
};
export const Document: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, page } = await ready(canvasElement);
    const toggle = canvas.queryByRole("button", {
      name: "Switch to Document view",
    });
    if (toggle) await userEvent.click(toggle);
    await attach(canvasElement, "Welcome");
    await attach(canvasElement, "Release checklist");
    const section = canvas.getByTestId("ai-attachment-section");
    expect(section).toHaveAttribute("data-presentation", "document");
    const chip = within(section).getByRole("button", { name: "Welcome" });
    await userEvent.hover(chip);
    await pathTooltip(chip, "Notes/Welcome.md");
    await userEvent.unhover(
      within(section).getByRole("button", { name: "Welcome" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Collapse Attachments 2" }),
    );
    expect(canvas.queryByRole("button", { name: "Remove Welcome" })).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Expand Attachments 2" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(
      canvas.getByRole("button", { name: "Remove Welcome" }),
    ).toBeVisible();
    expect(
      canvas.getByRole("button", { name: "Remove Release checklist" }),
    ).toBeVisible();
  },
};
export const FilePicker: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, page } = await ready(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
    const row = await page.findByRole("option", { name: /Release checklist/ });
    expect(row.querySelector("svg")).not.toBeNull();
    expect(
      row.querySelector('[data-ui-part="item-description"]'),
    ).toHaveTextContent("Notes/Archive/Planning/Release checklist.md");
    await userEvent.hover(row);
    await pathTooltip(row, "Notes/Archive/Planning/Release checklist.md");
    await userEvent.unhover(row);
    const search = page.getByPlaceholderText("Search vault files");
    await userEvent.type(search, "Release");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(
      canvas.getByRole("button", { name: "Remove Release checklist" }),
    ).toBeVisible();
  },
};

export const ThreeLineComposer: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await ready(canvasElement);
    for (const mode of ["Classic", "Document"]) {
      const toggle = canvas.queryByRole("button", {
        name: `Switch to ${mode} view`,
      });
      if (toggle) await userEvent.click(toggle);
      const input = messageEditor(canvas);
      const editor = input.closest<HTMLElement>(".mira")!;
      const lineHeight = parseFloat(getComputedStyle(input).lineHeight);
      const height = editor.getBoundingClientRect().height;
      expect(height + 0.5).toBeGreaterThanOrEqual(3 * lineHeight);
      expect(height).toBeLessThanOrEqual(3 * lineHeight + 20);
    }
    const input = messageEditor(canvas);
    await userEvent.type(
      input,
      "One{Shift>}{Enter}{/Shift}Two{Shift>}{Enter}{/Shift}Three{Shift>}{Enter}{/Shift}Four",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(messageEditor(canvas)).toHaveTextContent("Four");
  },
};
