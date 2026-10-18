import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FileView } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import BlameReviewDemo from "../../support/repository/blame-review/BlameReviewDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { historyContext } from "../../support/repository/context.ts";

const meta: Meta = {
  title: "Desktop/Repository blame layout review",
  component: BlameReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function ready(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  return within(element);
}
export const BlameLayout: StoryObj = {
  args: { sample: "small" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const view = within(
      await canvas.findByRole("region", { name: /^File blame$/ }),
    );
    await view.findByText("History is retained");
    expect(view.queryByText(/^Operation /)).toBeNull();
    expect(view.queryByText("Blame", { exact: true })).toBeNull();
    const viewport = canvasElement.querySelector<HTMLElement>(".store-blame")!;
    expect(viewport.querySelector(".store-blame__divider")).toBeNull();
    const groups = viewport.querySelectorAll<HTMLElement>(".blame-group");
    const last = groups[groups.length - 1]!;
    const border = last.querySelector<HTMLElement>(
      ".blame-group__end-divider",
    )!;
    expect(getComputedStyle(border).borderBottomWidth).toBe("1px");
    expect(
      Math.abs(
        last.getBoundingClientRect().bottom -
          border.getBoundingClientRect().bottom,
      ),
    ).toBeLessThanOrEqual(1);
    expect(last.getBoundingClientRect().bottom).toBeLessThan(
      viewport.getBoundingClientRect().bottom - 100,
    );
    const source = viewport.querySelectorAll<HTMLElement>(
      ".blame-group__source",
    )[1]!;
    expect(getComputedStyle(source).boxShadow).toContain("inset");
    const origin = viewport.querySelectorAll<HTMLElement>(
      ".blame-group__origin",
    )[1]!;
    expect(
      Math.abs(
        source.getBoundingClientRect().top - origin.getBoundingClientRect().top,
      ),
    ).toBeLessThanOrEqual(1);
  },
};
export const TitleBarAction: StoryObj = {
  args: { initialView: "editor", sample: "small" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Welcome.md$/ }),
    );
    const { app } = historyContext(canvasElement),
      editor = app.workspace.activeLeaf!;
    await waitFor(() => expect(editor.view).toBeInstanceOf(FileView));
    await waitFor(() =>
      expect(
        (editor.view as FileView).actions.find(
          (action) => action.title === "Blame file",
        )?.icon,
      ).toBe("git-merge-conflict"),
    );
    const button = await canvas.findByRole("button", {
      name: /^Blame file$/,
    });
    expect(button.closest("header")).not.toBeNull();
    expect(button.querySelector("svg")).not.toBeNull();
    await userEvent.click(button);
    const blame = within(
      await canvas.findByRole("region", { name: /^File blame$/ }),
    );
    await expect(await blame.findByText("History is retained")).toBeVisible();
    expect(app.workspace.activeLeaf?.view.getIcon()).toBe("git-merge-conflict");
    const host = getWorkspaceHostBinding(app.workspace).controller.workspace;
    const editorTab = host
      .getLeavesOfType(editor.view.getViewType())
      .find((leaf) => leaf.id === editor.id);
    expect(editorTab).toBeDefined();
    host.revealLeaf(editorTab!);
    await expect(
      await canvas.findByRole("button", { name: /^Blame file$/ }),
    ).toBeVisible();
  },
};
export const CommitDetails: StoryObj = {
  args: { sample: "large" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const [title] = await canvas.findAllByRole("button", {
      name: /Keep repository history beside the notes — Ada Chen/,
    });
    await userEvent.hover(title!);
    const page = within(canvasElement.ownerDocument.body);
    const card = await page.findByRole("region", { name: "Commit details" });
    await waitFor(() =>
      expect(
        within(card).getByText(/Keep repository history beside the notes/),
      ).toBeVisible(),
    );
    await expect(within(card).getByText("committed")).toBeVisible();
    await expect(within(card).getByText("+22")).toBeVisible();
    await expect(within(card).getByText("-15")).toBeVisible();
    expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(440);
    expect(card.textContent).not.toContain("Keep each read attached");
    const heading = card.querySelector("strong")!;
    expect(getComputedStyle(heading).webkitLineClamp).toBe("2");
  },
};
export const LargeFile: StoryObj = {
  args: { sample: "large" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    const { app } = historyContext(canvasElement);
    const workspace = getWorkspaceHostBinding(app.workspace).controller
      .workspace;
    await waitFor(() => {
      expect(workspace.getLayout().left.width).toMatch(/^0(?:px)?$/);
      expect(workspace.getLayout().right.width).toMatch(/^0(?:px)?$/);
    });
    for (const name of ["Left sidebar", "Right sidebar"]) {
      const sidebar = canvas.queryByLabelText(name);
      if (sidebar) expect(sidebar).not.toBeVisible();
    }
    const body = await canvas.findByRole("region", {
      name: "Blame for src/lib/repository/blame-controller.ts",
    });
    expect(body).toHaveAttribute("data-ui-component", "scroll-area");
    expect(body).toHaveAttribute("data-orientation", "both");
    const viewport = body.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    )!;
    await canvas.findAllByRole("button", {
      name: /Keep repository history beside the notes — Ada Chen/,
    });
    const gutter = viewport.querySelector<HTMLElement>(".blame-group__gutter")!;
    const number = viewport.querySelector<HTMLElement>(".blame-group__number")!;
    expect(getComputedStyle(gutter).borderRightWidth).toBe("0px");
    expect(number.getBoundingClientRect().width).toBeLessThan(60);
    await waitFor(() =>
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight * 3),
    );
    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() =>
      expect(
        viewport.querySelector(".blame-group__end-divider"),
      ).not.toBeNull(),
    );
    expect(viewport.querySelector(".store-blame__divider")).toBeNull();
    viewport.scrollTop = 0;
  },
};
export const StickyAttribution: StoryObj = {
  args: { sample: "large" },
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement);
    await canvas.findByRole("region", {
      name: "Blame for src/lib/repository/blame-controller.ts",
    });
    const viewport =
      canvasElement.querySelector<HTMLElement>(
        '.store-blame [data-ui-part="scroll-area-viewport"]',
      ) ?? canvasElement.querySelector<HTMLElement>(".store-blame")!;
    const origin = (start: number, end: number) =>
      viewport.querySelector<HTMLElement>(
        `[aria-label="Origin for lines ${start}–${end}"]`,
      )!;
    const top = () => viewport.getBoundingClientRect().top;
    viewport.scrollTop = 240;
    await waitFor(() =>
      expect(
        Math.abs(origin(6, 18).getBoundingClientRect().top - top()),
      ).toBeLessThanOrEqual(1),
    );
    expect(getComputedStyle(origin(6, 18)).borderTopWidth).toBe("0px");
    expect(getComputedStyle(origin(6, 18).parentElement!).boxShadow).toContain(
      "inset",
    );
    const next = origin(19, 25);
    expect(
      Math.abs(
        next.getBoundingClientRect().top -
          next.closest(".blame-group")!.getBoundingClientRect().top,
      ),
    ).toBeLessThanOrEqual(1);
    viewport.scrollTop = 490;
    await waitFor(() => {
      expect(origin(6, 18).getBoundingClientRect().top).toBeLessThan(top());
      expect(
        Math.abs(
          origin(6, 18).getBoundingClientRect().bottom -
            origin(19, 25).getBoundingClientRect().top,
        ),
      ).toBeLessThanOrEqual(1);
    });
    viewport.scrollTop = 510;
    await waitFor(() =>
      expect(
        Math.abs(origin(19, 25).getBoundingClientRect().top - top()),
      ).toBeLessThanOrEqual(1),
    );
    viewport.scrollTop = 1006;
    await waitFor(() =>
      expect(
        Math.abs(origin(28, 51).getBoundingClientRect().top - top()),
      ).toBeLessThanOrEqual(1),
    );
    viewport.scrollLeft = 80;
    await waitFor(() =>
      expect(
        Math.abs(
          origin(28, 51).getBoundingClientRect().left -
            viewport.getBoundingClientRect().left,
        ),
      ).toBeLessThanOrEqual(1),
    );
    viewport.scrollLeft = 0;
  },
};
