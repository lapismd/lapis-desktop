import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AiShellDemo from "../../support/ai/shell/AiShellDemo.svelte";
import { expect, userEvent, within, waitFor } from "storybook/test";

const meta = {
  title: "Desktop/AI/Chat layout review",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { scenario: "registry-chat", reviewLayout: true },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Conversation: Story = {};
export const SendingError: Story = {
  args: { scenario: "sending-error" },
};
export const InlineLocalCommands: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const editor = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard("/help{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const report = await canvas.findByLabelText("Command output");
    await expect(report).toBeVisible();
    const frame = report.closest<HTMLElement>('[role="group"]')!;
    expect(getComputedStyle(frame).borderTopWidth).toBe("0px");
    expect(getComputedStyle(frame).paddingTop).toBe("0px");
    expect(getComputedStyle(report).borderTopWidth).toBe("0px");
    expect(getComputedStyle(report).paddingTop).toBe("0px");
    expect(report.textContent).toContain("App\n  /help — ");
    expect(getComputedStyle(report).whiteSpace).toBe("pre-wrap");
    expect(getComputedStyle(report).fontFamily).toMatch(/mono/i);
    const command = within(report).getByText("/help", { exact: true });
    expect(getComputedStyle(command).color).not.toBe(
      getComputedStyle(report).color,
    );
    await waitFor(() => expect(editor).not.toHaveTextContent("/help"));
    await userEvent.click(editor);
    await userEvent.keyboard("/search project{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const result = await canvas.findByRole("button", {
      name: "Hide details for notes_search",
    });
    await userEvent.click(result);
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for notes_search" }),
    );
    expect(canvas.queryByLabelText("Tool details")).toBeNull();
    expect(
      canvas.getByRole("button", { name: "Hide details for notes_search" }),
    ).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Show raw output for notes_search",
      }),
    );
    expect(canvas.queryByLabelText("Tool details")).toBeNull();
    expect(
      canvas.getByRole("button", {
        name: "Show rich output for notes_search",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Show rich output for notes_search",
      }),
    );
  },
};
export const LiveInboxControls: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const editor = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard("/help");
    const option = await page.findByRole("option", { name: /^\/help App/ });
    const label = option.querySelector(".cm-completionLabel")!;
    const detail = option.querySelector(".cm-completionDetail")!;
    expect(detail.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().bottom,
    );
    expect(getComputedStyle(detail).whiteSpace).toBe("normal");
    await userEvent.keyboard("{Escape}");
    const opener = canvas.getByRole("button", {
      name: "Show details for vault.read · Notes/Welcome.md",
    });
    await userEvent.click(opener);
    const inspector = await page.findByLabelText("Tool details");
    await expect(
      within(inspector).findByText("Welcome to the project"),
    ).resolves.toBeVisible();
    await userEvent.click(
      within(inspector).getByRole("button", { name: /^Source$/ }),
    );
    await expect(
      within(inspector).findByRole("textbox", { name: /Notes\/Welcome.md/ }),
    ).resolves.toHaveTextContent("# Welcome to the project");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
    await expect(editor).toHaveTextContent("/help");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(editor).toBeInTheDocument();
    await expect(editor).toHaveTextContent("/help");
  },
};
export const FixedErrorFeedback: Story = {
  name: "Inline interruption feedback",
  args: { scenario: "sending-error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const error = await canvas.findByRole("alert");
    await expect(error).toHaveTextContent("Your message is retained");
    expect(error).toHaveAccessibleName("Turn interrupted");
    expect(canvas.getAllByRole("alert")).toHaveLength(1);
    expect(
      canvasElement.querySelector(".transcript-send-hint [role='alert']"),
    ).toBeNull();
    const retry = within(error).getByRole("button", { name: "Retry message" });
    expect(retry.textContent?.trim()).toBe("");
    expect(
      error.getBoundingClientRect().right - retry.getBoundingClientRect().right,
    ).toBeLessThan(20);
    retry.focus();
    await expect(
      within(canvasElement.ownerDocument.body).findByRole("tooltip"),
    ).resolves.toHaveTextContent("Retry message");
    retry.blur();
    const footer = canvasElement.querySelector(".ai-session-footer")!;
    expect(error.closest(".ai-session-footer")).toBeNull();
    await waitFor(() =>
      expect(error.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        footer.getBoundingClientRect().top,
      ),
    );
    expect(
      parseFloat(getComputedStyle(error).borderBottomLeftRadius),
    ).toBeGreaterThan(0);
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await expect(
      canvas.getByRole("textbox", { name: /^Message$/ }),
    ).toHaveTextContent("Summarize the open questions");
    await expect(
      canvas.getByRole("button", { name: "Send message" }),
    ).toBeVisible();
  },
};
export const FailedSendRetainsDraft: Story = {
  args: { scenario: "send-failure" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const editor = await canvas.findByRole("textbox", { name: /^Message$/ });
    await userEvent.click(editor);
    await userEvent.keyboard(
      "Keep this authored message after the failed send",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const error = await within(panel).findByRole("alert");
    await expect(error).toHaveTextContent(/retained|acknowledged|queued/i);
    await expect(editor).toHaveTextContent(
      "Keep this authored message after the failed send",
    );
    expect(error.closest(".ai-session-footer")).toBeNull();
  },
};

export const EmptyLocalSearch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const editor = canvas.getByRole("textbox", { name: "Message" });
    await userEvent.click(editor);
    await userEvent.keyboard("/search missing-search-fixture-9841{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    const empty = await canvas.findByText("No matching notes.");
    const root = empty.closest(
      '[data-ui-component="empty"][data-ui-part="empty"]',
    );
    expect(root).not.toBeNull();
    expect(root!.querySelector("svg")).not.toBeNull();
    expect(canvas.queryByLabelText("Tool details")).toBeNull();
    const shell =
      canvasElement.querySelector<HTMLElement>(".ai-session-shell")!;
    const body = shell.querySelector<HTMLElement>(
      '[data-ui-component="app-shell"][data-ui-part="body"]',
    )!;
    const outer = shell.getBoundingClientRect(),
      inner = body.getBoundingClientRect();
    expect(outer.bottom - inner.bottom).toBeCloseTo(inner.top - outer.top, 0);
  },
};

export const LongMessagesWithSidebars: Story = {
  args: { longMessages: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    await waitFor(() =>
      expect(panel).toHaveAttribute("data-initializing", "false"),
    );
    const thread =
      canvasElement.querySelector<HTMLElement>(".ai-session-thread")!;
    const assertFits = async () => {
      await waitFor(() =>
        expect(
          thread.querySelectorAll('[data-chat-reader$="/body"]'),
        ).toHaveLength(2),
      );
      const tool = within(thread).getByRole("button", {
        name: /^Show details for vault.read/,
      });
      await waitFor(() => {
        const shellBounds = canvasElement
          .querySelector<HTMLElement>(".ai-session-shell")!
          .getBoundingClientRect();
        expect(thread.getBoundingClientRect().right).toBeLessThanOrEqual(
          shellBounds.right + 1,
        );
        expect(thread.scrollWidth).toBeLessThanOrEqual(thread.clientWidth + 1);
        for (const reader of thread.querySelectorAll<HTMLElement>(
          '[data-chat-reader$="/body"]',
        )) {
          const line = reader.querySelector<HTMLElement>(".cm-line")!;
          expect(line.getBoundingClientRect().height).toBeGreaterThan(
            parseFloat(getComputedStyle(line).lineHeight) * 2,
          );
          expect(reader.scrollWidth).toBeLessThanOrEqual(
            reader.clientWidth + 1,
          );
          expect(reader.getBoundingClientRect().right).toBeLessThanOrEqual(
            thread.getBoundingClientRect().right,
          );
        }
        expect(tool.textContent).toContain("SKILL.md");
        expect(tool.scrollWidth).toBeLessThanOrEqual(tool.clientWidth + 1);
        expect(tool.getBoundingClientRect().right).toBeLessThanOrEqual(
          thread.getBoundingClientRect().right,
        );
        const title = tool.querySelector<HTMLElement>("span")!;
        expect(title.clientWidth).toBeGreaterThan(40);
        expect(title.getBoundingClientRect().height).toBeLessThanOrEqual(
          parseFloat(getComputedStyle(title).lineHeight) + 1,
        );
        expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
      });
      tool.focus();
      await expect(
        within(canvasElement.ownerDocument.body).findByRole("tooltip"),
      ).resolves.toHaveTextContent(
        tool.textContent!.replace(/^vault.read · /, ""),
      );
      tool.blur();
      const fade = thread.querySelector<HTMLElement>(
        ".ui-transcript-scroll-fade",
      )!;
      await waitFor(() => expect(fade).toHaveAttribute("data-visible", "true"));
      expect(getComputedStyle(fade).pointerEvents).toBe("none");
      expect(fade.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        thread
          .querySelector<HTMLElement>(".ui-transcript-body-footer")!
          .getBoundingClientRect().top + 1,
      );
    };
    await assertFits();
    const initialThreadWidth = canvasElement
      .querySelector<HTMLElement>(".ai-session-thread")!
      .getBoundingClientRect().width;
    await userEvent.click(
      canvas.getByRole("button", { name: "Close left sidebar" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Close right sidebar" }),
    );
    await waitFor(() =>
      expect(
        canvasElement
          .querySelector<HTMLElement>(".ai-session-thread")!
          .getBoundingClientRect().width,
      ).toBeGreaterThan(initialThreadWidth + 100),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open left sidebar" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Open right sidebar" }),
    );
    for (const side of ["left", "right"])
      await expect(
        canvas.getByRole("complementary", {
          name: `${side === "left" ? "Left" : "Right"} sidebar`,
        }),
      ).toBeVisible();
    const shellWidth = canvasElement
      .querySelector<HTMLElement>(".ai-session-shell")!
      .getBoundingClientRect().width;
    if (shellWidth >= 640)
      await expect(
        canvasElement.querySelector(".ai-session-list"),
      ).toBeVisible();
    else
      await expect(
        canvas.getByRole("checkbox", { name: "Toggle conversations" }),
      ).toBeVisible();
    await assertFits();
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    await assertFits();
    await expect(
      canvas.getByRole("button", { name: "Send message" }),
    ).toBeVisible();
  },
};
