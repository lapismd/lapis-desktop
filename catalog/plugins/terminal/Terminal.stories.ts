import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within, userEvent, waitFor } from "storybook/test";
import TerminalDemo from "../../support/terminal/TerminalDemo.svelte";
import { colorChecks } from "../../support/terminal/color-checks";
import { cleanupCatalog } from "../../support/lifecycle";
import { terminalReview } from "../../support/terminal/review";

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
  await waitFor(async () =>
    expect(
      canvas.getByRole("textbox", { name: "Terminal output" }),
    ).toHaveTextContent("Lapis Terminal"),
  );
  return canvas;
}
async function inspect(element: HTMLElement) {
  return terminalReview(element).inspect();
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
    await waitFor(async () =>
      expect(
        canvas.queryByRole("complementary", { name: "Bottom panel" }),
      ).toBeNull(),
    );
    expect((await inspect(canvasElement)).sessions).toBe(1);
    await userEvent.click(
      canvas.getByRole("button", { name: "Open bottom panel" }),
    );
    await waitFor(async () =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("Lapis Terminal"),
    );
    expect(canvasElement.querySelector("[data-session-id]")).toHaveAttribute(
      "data-session-id",
      id,
    );
    await terminalReview(canvasElement).move();
    await waitFor(async () =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toBeInTheDocument(),
    );
    expect((await inspect(canvasElement)).sessions).toBe(1);
    await terminalReview(canvasElement).close();
    await waitFor(async () => {
      expect((await inspect(canvasElement)).sessions).toBe(0);
    });
  },
};
export const RestoredStart: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await terminalReview(canvasElement).restore();
    const start = await canvas.findByRole("button", {
      name: "Start",
    });
    expect((await inspect(canvasElement)).sessions).toBe(0);
    await userEvent.click(start);
    await waitFor(async () =>
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
    await waitFor(async () =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("echo"),
    );
    const surface = canvasElement.querySelector(".lt-viewport")!;
    surface.dispatchEvent(
      new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 160 }),
    );
    await terminalReview(canvasElement).resize();
    await waitFor(async () => {
      expect((await inspect(canvasElement)).scrolls).not.toContain("[]");
    });
    expect((await inspect(canvasElement)).dimensions).not.toContain("[]");
    await waitFor(() => {
      const shell = canvasElement.querySelector<HTMLElement>(".notes-session")!;
      expect(
        Math.abs(
          shell.getBoundingClientRect().height -
            canvasElement.ownerDocument.defaultView!.innerHeight,
        ),
      ).toBeLessThan(2);
    });
    await terminalReview(canvasElement).disable();
    await waitFor(async () =>
      expect((await inspect(canvasElement)).sessions).toBe(0),
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
    expect((await inspect(canvasElement)).inputs).toContain("[]");
    input.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "日本語" }),
    );
    await waitFor(async () =>
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
    await waitFor(async () =>
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
    await waitFor(async () =>
      expect(
        canvas.getByRole("textbox", { name: "Terminal output" }),
      ).toHaveTextContent("y"),
    );
  },
};
export const Exited: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await terminalReview(canvasElement).exit();
    await waitFor(async () =>
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
    await waitFor(async () =>
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
    expect((await inspect(canvasElement)).sessions).toBe(1);
    expect((await inspect(canvasElement)).preferences).toContain(
      '"shell":"/bin/sh"',
    );
    expect((await inspect(canvasElement)).preferences).toContain(
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
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
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
      expect((await inspect(canvasElement)).preferences).toContain(
        '"shell":"/bin/zsh"',
      );
      expect((await inspect(canvasElement)).configuration).toContain(
        '"pluginData"',
      );
    });
    expect((await inspect(canvasElement)).configuration).toContain(
      '"retainedExtra":true',
    );
    expect((await inspect(canvasElement)).configuration).not.toContain(
      '"terminal.shell":',
    );
    expect((await inspect(canvasElement)).configuration).not.toContain(
      '"terminal.cwd":',
    );
  },
};

export const MultipleTerminals: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await open(canvasElement);
    await terminalReview(canvasElement).fixture.app?.commands.executeCommand(
      "terminal:new",
    );
    await waitFor(async () => {
      expect((await inspect(canvasElement)).sessions).toBe(2);
    });
    await terminalReview(canvasElement).close();
    await waitFor(async () => {
      expect((await inspect(canvasElement)).sessions).toBe(1);
    });
    expect(
      canvas.getByRole("textbox", { name: "Terminal input" }),
    ).toBeEnabled();
  },
};
