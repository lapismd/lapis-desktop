import { expect, userEvent, waitFor, within } from "storybook/test";

export async function reviewCodeFold(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const panel = await canvas.findByTestId("ai-chat-panel");
  await waitFor(() =>
    expect(panel).toHaveAttribute("data-initializing", "false"),
  );
  let more = await canvas.findByRole("button", {
    name: "Show 40 more lines in typescript code",
  });
  const viewport = more.closest<HTMLElement>(
    '[data-ui-part="scroll-area-viewport"]',
  )!;
  if (viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1) {
    const scrolled = new Promise<void>((resolve) =>
      viewport.addEventListener("scroll", () => resolve(), { once: true }),
    );
    viewport.scrollTop = viewport.scrollHeight;
    await scrolled;
  }
  more.scrollIntoView({ block: "center", behavior: "instant" });
  await waitFor(() =>
    expect(
      canvas.getByRole("button", { name: /^Scroll to latest/ }),
    ).toBeVisible(),
  );
  more = await canvas.findByRole("button", {
    name: "Show 40 more lines in typescript code",
  });
  await expect(more).toBeVisible();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(more);
  const less = await canvas.findByRole("button", {
    name: "Show less in typescript code",
  });
  await expect(less).toBeVisible();
  await expect(less).toHaveAttribute("aria-expanded", "true");
  await userEvent.click(less);
  await expect(
    canvas.findByRole("button", {
      name: "Show 40 more lines in typescript code",
    }),
  ).resolves.toBeVisible();
}
