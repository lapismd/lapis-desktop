import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { RepositoryPanel } from "@lapismd/repository-ui/jj";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import {
  openHistory,
  openHistoryFile,
} from "../../support/repository/interactions.ts";
import { revision } from "../../support/repository/fixture.ts";
const meta: Meta = {
  title: "Desktop/Repository history",
  component: RepositoryPanel,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: () => ({ Component: RepositoryDemo }),
};
export default meta;
export const IdentifierCopyAndRecovery: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement),
      writes: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    let fail = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          if (fail) throw new Error("Clipboard access denied");
          writes.push(value);
        },
      },
    });
    try {
      const git = await canvas.findByRole("button", {
        name: new RegExp(`Copy Git commit SHA ${revision}`),
      });
      await userEvent.hover(git);
      await waitFor(() => expect(git).toHaveAttribute("data-active", "true"));
      await userEvent.click(git);
      expect(writes).toEqual([revision]);
      await expect(git).toHaveAttribute("data-copied", "true");
      const jj = canvas.getAllByRole("button", {
        name: /Copy JJ Change ID/,
      })[0];
      jj.focus();
      await expect(jj).toHaveFocus();
      await userEvent.click(jj);
      expect(writes[1]).toBe("p".repeat(32));
      await expect(jj).toHaveAttribute("data-copied", "true");
      expect(
        canvas.queryByRole("region", { name: "Changed files" }),
      ).toBeNull();
      fail = true;
      await userEvent.click(git);
      const body = within(canvasElement.ownerDocument.body);
      await expect(
        await body.findByText("Clipboard access denied"),
      ).toBeVisible();
      await expect(git).toHaveAttribute("data-copy-failed", "true");
      fail = false;
      await userEvent.click(git);
      await waitFor(() =>
        expect(body.queryByText("Clipboard access denied")).toBeNull(),
      );
      await expect(git).toHaveAttribute("data-copied", "true");
    } finally {
      if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
      else Reflect.deleteProperty(navigator, "clipboard");
    }
  },
};
export const ExpandedFilesAndDiffControls: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistoryFile(canvasElement);
    await canvas.findByRole("region", { name: "Changes to Welcome.md" });
    for (const name of [
      "Show files as list",
      "Show files as packages",
      "Show files as folders",
    ]) {
      const mode = canvas.getByRole("radio", { name });
      await userEvent.click(mode);
      await expect(mode).toHaveAttribute("aria-checked", "true");
      await expect(
        canvas.getByRole("button", { name: /^Welcome\.md(?: |$)/ }),
      ).toBeVisible();
    }
    const wrap = canvas.getByRole("button", { name: "Wrap text" });
    await userEvent.click(wrap);
    await expect(wrap).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "Close Diff column" }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole("region", { name: "Revision changes" }),
      ).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: /^Welcome\.md(?: |$)/ }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toBeVisible();
    const row = canvas.getByRole("button", {
      name: /Keep repository history beside the notes/,
    });
    await userEvent.click(row);
    await expect(row).toHaveAttribute("aria-expanded", "false");
    expect(canvas.queryByRole("region", { name: "Changed files" })).toBeNull();
    await userEvent.click(row);
    await expect(
      await canvas.findByRole("region", { name: "Changed files" }),
    ).toBeVisible();
    const pane = canvasElement.querySelector(".repository-panel")!,
      body = canvasElement.querySelector(
        '.repository-shell [data-ui-part="body"]',
      )!;
    expect(
      Math.abs(
        pane.getBoundingClientRect().height -
          body.getBoundingClientRect().height,
      ),
    ).toBeLessThan(2);
  },
};

export const ResizingAndCompactReturn: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistoryFile(canvasElement);
    await canvas.findByRole("region", { name: "Changes to Welcome.md" });
    const shell = within(canvasElement);
    await userEvent.click(
      shell.getByRole("button", { name: "Close left sidebar" }),
    );
    await userEvent.click(
      shell.getByRole("button", { name: "Close right sidebar" }),
    );
    const root = canvas.getByRole("region", {
      name: "Repository history columns",
    });
    if (canvasElement.ownerDocument.defaultView!.innerWidth > 800) {
      await waitFor(() =>
        expect(root).toHaveAttribute("data-display-mode", "wide"),
      );
      const revisions = canvas.getByRole("region", { name: "Revisions" }),
        before = revisions.getBoundingClientRect().width;
      const resize = canvas.getByRole("separator", {
        name: "Resize JJ Log and Diff columns",
      });
      resize.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() =>
        expect(revisions.getBoundingClientRect().width).toBeGreaterThan(before),
      );
      const row = canvasElement.querySelector<HTMLElement>(
          ".repository-graph > li",
        )!,
        graph = row.querySelector("svg")!;
      await waitFor(() =>
        expect(graph.getBoundingClientRect().height).toBeGreaterThan(
          row.getBoundingClientRect().height - 3,
        ),
      );
    } else {
      await expect(root).toHaveAttribute("data-display-mode", "compact");
    }
    await userEvent.click(
      canvas.getByRole("button", { name: "Close Diff column" }),
    );
    await expect(
      canvas.getByRole("list", { name: "Revision graph" }),
    ).toBeVisible();
    expect(
      canvas.queryByRole("region", { name: "Revision changes" }),
    ).toBeNull();
  },
};

export const ExpandedRowKeepsFilesInView: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Changed files" }),
    ).toBeVisible();
    expect(
      canvas.queryByRole("region", { name: "Revision changes" }),
    ).toBeNull();
    const pane = canvasElement
        .querySelector(".repository-panel")!
        .getBoundingClientRect(),
      file = canvas
        .getByRole("button", { name: "Welcome.md" })
        .getBoundingClientRect();
    await waitFor(() => expect(file.left).toBeGreaterThanOrEqual(pane.left));
  },
};
