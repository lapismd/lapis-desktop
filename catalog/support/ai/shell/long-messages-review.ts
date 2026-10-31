import { expect, userEvent, within, waitFor } from "storybook/test";

export async function reviewLongMessages(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const panel = await canvas.findByTestId("ai-chat-panel");
  await waitFor(() =>
    expect(panel).toHaveAttribute("data-initializing", "false"),
  );
  const thread =
    canvasElement.querySelector<HTMLElement>(".ai-session-thread")!;
  const assertFits = async () => {
    const toggle = canvas.getByRole("button", {
      name: "Toggle conversations",
    });
    if (
      thread.closest(".ai-session-shell")!.getBoundingClientRect().width >=
        640 &&
      toggle.getAttribute("aria-pressed") === "false"
    )
      await userEvent.click(toggle);
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
        expect(reader.scrollWidth).toBeLessThanOrEqual(reader.clientWidth + 1);
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
    const viewport = thread.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    )!;
    await waitFor(() =>
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight),
    );
    viewport.scrollTo({ top: 0, behavior: "instant" });
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
  await assertFits();
  if (shellWidth >= 640)
    await expect(canvasElement.querySelector(".ai-session-list")).toBeVisible();
  else
    await expect(
      canvas.getByRole("button", { name: "Toggle conversations" }),
    ).toBeVisible();
  await userEvent.click(
    canvas.getByRole("button", { name: "Switch to Classic view" }),
  );
  await assertFits();
  await expect(
    canvas.getByRole("button", { name: "Send message" }),
  ).toBeVisible();
}
