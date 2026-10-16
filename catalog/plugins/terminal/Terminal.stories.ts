import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import TerminalDemo from "../../support/terminal/TerminalDemo.svelte";
import { colorChecks } from "../../support/terminal/color-checks";
import { cleanupCatalog } from "../../support/lifecycle";

const meta = {
  title: "Desktop/Terminal",
  component: TerminalDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof TerminalDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function ready(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  return within(element);
}
async function open(element: HTMLElement) {
  const canvas = await ready(element);
  await userEvent.click(canvas.getByRole("button", { name: "Open Terminal" }));
  await waitFor(() =>
    expect(
      canvas.getByRole("textbox", { name: "Terminal output" }),
    ).toHaveTextContent("Lapis Terminal"),
  );
  return canvas;
}
async function inspect(element: HTMLElement) {
  await userEvent.click(
    within(element).getByRole("button", { name: "Inspect native sessions" }),
  );
}

export const DockRetention: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const id = canvasElement
      .querySelector("[data-session-id]")!
      .getAttribute("data-session-id");
    const panel = canvas.getByRole("complementary", { name: "Bottom panel" });
    await userEvent.click(
      within(panel).getByRole("button", { name: "Close bottom panel" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("complementary", { name: "Bottom panel" }),
      ).toBeNull(),
    );
    await inspect(canvasElement);
    expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("1");
    await userEvent.click(
      canvas.getByRole("button", { name: "Open bottom panel" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("Lapis Terminal"),
    );
    expect(canvasElement.querySelector("[data-session-id]")).toHaveAttribute(
      "data-session-id",
      id,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Move terminal to main pane" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toBeInTheDocument(),
    );
    await inspect(canvasElement);
    expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("1");
    await userEvent.click(
      canvas.getByRole("button", { name: "Close terminal tab" }),
    );
    await waitFor(async () => {
      await inspect(canvasElement);
      expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("0");
    });
  },
};
export const RestoredStart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Restore old terminal tab" }),
    );
    const start = await canvas.findByRole("button", {
      name: "Start",
    });
    await inspect(canvasElement);
    expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("0");
    await userEvent.click(start);
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("Lapis Terminal"),
    );
  },
};
export const InputResizeAndScroll: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Terminal input" });
    await userEvent.click(input);
    await userEvent.keyboard("echo{Enter}");
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("echo"),
    );
    const surface = canvasElement.querySelector(".lt-viewport")!;
    surface.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 160 }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Resize workspace" }),
    );
    await waitFor(async () => {
      await inspect(canvasElement);
      expect(canvas.getByLabelText("Scroll deltas")).not.toHaveTextContent(
        "[]",
      );
    });
    expect(canvas.getByLabelText("Terminal dimensions")).not.toHaveTextContent(
      "[]",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Disable Terminal" }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("0"),
    );
  },
};
export const ImePasteCopy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    const input = canvas.getByRole("textbox", {
      name: "Terminal input",
    }) as HTMLTextAreaElement;
    input.focus();
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    input.value = "日本語";
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, isComposing: true }),
    );
    await inspect(canvasElement);
    expect(canvas.getByLabelText("Sent input")).toHaveTextContent("[]");
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "日本語" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("日本語"),
    );
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", "paste payload");
    input.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboard,
      }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("paste payload"),
    );
    const row = canvasElement.querySelector('[data-terminal-row="0"]')!;
    const range = document.createRange();
    range.setStart(row.firstChild!, 0);
    range.setEnd(row.firstChild!, 5);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = new DataTransfer();
    document.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: copied,
      }),
    );
    expect(copied.getData("text/plain")).toBe("Lapis");
    selection.removeAllRanges();
  },
};
export const Unavailable: Story = {
  args: { scenario: "unavailable" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open Terminal" }),
    );
    await within(
      canvasElement.querySelector<HTMLElement>(".terminal-panel")!,
    ).findByText("Terminal service unavailable");
    expect(canvas.getByRole("button", { name: "Start" })).toBeEnabled();
  },
};
export const RecoverableError: Story = {
  args: { scenario: "error" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Terminal input" }),
    );
    await userEvent.keyboard("x");
    await canvas.findByText("Terminal temporarily unavailable");
    await userEvent.keyboard("y");
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("y"),
    );
  },
};
export const Exited: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Exit shell" }));
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal input" }),
      ).toBeDisabled(),
    );
    await canvas.findByText(/Shell exited/);
  },
};
export const HighOutput: Story = {
  args: { scenario: "high-output" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open Terminal" }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("build step"),
    );
  },
};
export const Disabled: Story = {
  args: { scenario: "disabled" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    expect(canvas.queryByRole("button", { name: "Open Terminal" })).toBeNull();
  },
};
export const SafeMode: Story = {
  ...Disabled,
  args: { scenario: "safe-mode" },
};

export const InstalledCopyPrecedence: Story = {
  args: { scenario: "installed-copy" },
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    expect(
      canvas.getAllByRole("button", { name: "Open Terminal" }),
    ).toHaveLength(1);
    await inspect(canvasElement);
    expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("1");
    expect(canvas.getByLabelText("Terminal preferences")).toHaveTextContent(
      '"shell":"/bin/sh"',
    );
    expect(canvas.getByLabelText("Terminal preferences")).toHaveTextContent(
      '"cwd":"notes"',
    );
  },
};
export const InstalledDisabled: Story = {
  ...Disabled,
  args: { scenario: "installed-disabled" },
};

export const ColoredOutput: Story = {
  args: { scenario: "colored" },
  play: async ({ canvasElement }) => {
    await open(canvasElement);
    await colorChecks(canvasElement);
  },
};

export const SettingsSource: Story = {
  args: { scenario: "installed-copy" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open settings" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Terminal" }),
    );
    const shell = await canvas.findByRole("textbox", { name: "Shell path" });
    await userEvent.clear(shell);
    await userEvent.type(shell, "/bin/zsh");
    await userEvent.tab();
    await userEvent.keyboard("{Escape}");
    await waitFor(async () => {
      await inspect(canvasElement);
      expect(canvas.getByLabelText("Terminal preferences")).toHaveTextContent(
        '"shell":"/bin/zsh"',
      );
      expect(
        canvas.getByLabelText("Canonical configuration"),
      ).toHaveTextContent('"pluginData"');
    });
    expect(canvas.getByLabelText("Canonical configuration")).toHaveTextContent(
      '"retainedExtra":true',
    );
    expect(
      canvas.getByLabelText("Canonical configuration"),
    ).not.toHaveTextContent('"terminal.shell":');
    expect(
      canvas.getByLabelText("Canonical configuration"),
    ).not.toHaveTextContent('"terminal.cwd":');
  },
};

export const MultipleTerminals: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "New terminal command" }),
    );
    await waitFor(async () => {
      await inspect(canvasElement);
      expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("2");
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Close terminal tab" }),
    );
    await waitFor(async () => {
      await inspect(canvasElement);
      expect(canvas.getByLabelText("Retained sessions")).toHaveTextContent("1");
    });
    expect(
      canvas.getByRole("textbox", { name: "Terminal input" }),
    ).toBeEnabled();
  },
};
