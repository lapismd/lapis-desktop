import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BlameReviewDemo from "../../support/repository/blame-review/BlameReviewDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";
import { openBlameReview } from "../../support/repository/blame-review/title-actions.ts";
import { largeBlamePath } from "../../support/repository/blame-review/large-fixture.ts";
import { operation, revision } from "../../support/repository/fixture.ts";

const key = "lapis.desktop.repository.blame.wrap";
const meta = {
  title: "Desktop/Repository blame wrapping",
  component: BlameReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  args: { sample: "long-lines" },
  beforeEach: () => {
    const previous = localStorage.getItem(key);
    localStorage.removeItem(key);
    return async () => {
      await cleanupCatalog();
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
    };
  },
} satisfies Meta<typeof BlameReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function blame(element: HTMLElement) {
  const canvas = within(element);
  const region = await canvas.findByRole(
    "region",
    { name: "File blame" },
    { timeout: 30_000 },
  );
  const view = within(region);
  const viewport = region.querySelector<HTMLElement>(
    '.store-blame [data-ui-part="scroll-area-viewport"]',
  )!;
  await waitFor(() =>
    expect(viewport.querySelector('[data-line="1"] code')).not.toBeNull(),
  );
  return { view, viewport };
}
function firstLine(viewport: HTMLElement) {
  return viewport.querySelector<HTMLElement>('[data-line="1"] code')!;
}
function aligned(viewport: HTMLElement) {
  const first = firstLine(viewport).closest(".blame-group")!;
  const next = viewport
    .querySelector('[data-line="5"]')!
    .closest(".blame-group")!;
  expect(
    Math.abs(
      first.getBoundingClientRect().bottom - next.getBoundingClientRect().top,
    ),
  ).toBeLessThanOrEqual(1);
}
export const LongLines: Story = {
  play: async ({ canvasElement }) => {
    const { view, viewport } = await blame(canvasElement);
    const toggle = view.getByRole("button", { name: "Wrap text" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    const text = firstLine(viewport).textContent;
    await waitFor(() => {
      expect(
        firstLine(viewport).getBoundingClientRect().height,
      ).toBeGreaterThan(56);
      expect(viewport.scrollWidth).toBeLessThanOrEqual(
        viewport.clientWidth + 1,
      );
      aligned(viewport);
    });
    const height = firstLine(viewport).getBoundingClientRect().height;
    const root =
      canvasElement.querySelector<HTMLElement>(".blame-review-demo")!;
    root.style.width = "620px";
    try {
      await waitFor(() => {
        expect(
          firstLine(viewport).getBoundingClientRect().height,
        ).toBeGreaterThan(height);
        expect(viewport.scrollWidth).toBeLessThanOrEqual(
          viewport.clientWidth + 1,
        );
        aligned(viewport);
      });
      await userEvent.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveAttribute("aria-pressed", "false");
        expect(firstLine(viewport).getBoundingClientRect().height).toBe(28);
        expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        aligned(viewport);
      });
      expect(firstLine(viewport).textContent).toBe(text);
      await userEvent.click(toggle);
    } finally {
      root.style.removeProperty("width");
    }
    await waitFor(() => {
      expect(
        firstLine(viewport).getBoundingClientRect().height,
      ).toBeGreaterThan(56);
      aligned(viewport);
    });
    // Manual toggles must remain correct after the initial play has settled.
    for (const pressed of [false, true]) {
      await userEvent.click(toggle);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await waitFor(() => {
        expect(toggle).toHaveAttribute("aria-pressed", String(pressed));
        aligned(viewport);
      });
    }
  },
};
export const RememberedPreference: Story = {
  play: async ({ canvasElement }) => {
    let current = await blame(canvasElement);
    const { app } = historyContext(canvasElement);
    for (const pressed of [false, true]) {
      await userEvent.click(
        current.view.getByRole("button", { name: "Wrap text" }),
      );
      await waitFor(() =>
        expect(localStorage.getItem(key)).toBe(String(pressed)),
      );
      app.workspace.activeLeaf!.close();
      await openBlameReview(app, {
        operation,
        commit: revision,
        path: largeBlamePath,
      });
      current = await blame(canvasElement);
      expect(
        current.view.getByRole("button", { name: "Wrap text" }),
      ).toHaveAttribute("aria-pressed", String(pressed));
    }
  },
};
