// SPDX-License-Identifier: Apache-2.0
// Retained complete Lapis placement geometry/paint assertions.
import { expect, waitFor, within } from "storybook/test";
import {
  AI_PANEL_META,
  type AiPanelKind,
  type AiPanelLayout,
} from "./layout.ts";
export async function expectAiPlacement(
  canvasElement: HTMLElement,
  kind: AiPanelKind,
  layout: AiPanelLayout,
  testId: string,
  args: Record<string, unknown>,
) {
  await expect(args).not.toHaveProperty("kind");
  await expect(args).not.toHaveProperty("layout");

  const canvas = within(canvasElement);
  const requiresFile = AI_PANEL_META[kind].requiresFile;
  await waitFor(
    () => {
      expect(canvas.getByTestId("ai-workspace-demo")).toHaveAttribute(
        "data-status",
        "ready",
      );
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull();
      expect(canvas.getAllByTestId(testId)).toHaveLength(1);
      const markdown =
        canvasElement.querySelector(".markdown-view") ||
        canvasElement.querySelector(
          '[data-ui-component="markdown-mira-preview"]',
        ) ||
        canvasElement.querySelector(".markdown-view__editor");
      if (requiresFile) expect(markdown).not.toBeNull();
      else expect(markdown).toBeNull();
    },
    { timeout: 20_000 },
  );

  await new Promise<void>((resolve) => {
    const storyWindow = canvasElement.ownerDocument.defaultView;
    if (storyWindow) storyWindow.setTimeout(resolve, 150);
    else resolve();
  });
  await waitFor(() => {
    expect(canvas.getAllByTestId(testId)).toHaveLength(1);
  });

  const demo = canvas.getByTestId("ai-workspace-demo");
  const storyRoot =
    (demo.closest("#storybook-root") as HTMLElement | null) ?? canvasElement;
  const viewport = canvasElement.ownerDocument.documentElement;
  const demoBox = demo.getBoundingClientRect();
  const rootBox = storyRoot.getBoundingClientRect();
  await expect(Math.abs(demoBox.width - rootBox.width)).toBeLessThan(1);
  await expect(Math.abs(demoBox.height - rootBox.height)).toBeLessThan(1);
  if (storyRoot.id === "storybook-root") {
    await expect(Math.abs(rootBox.width - viewport.clientWidth)).toBeLessThan(
      1,
    );
    await expect(Math.abs(rootBox.height - viewport.clientHeight)).toBeLessThan(
      1,
    );
    await expect(getComputedStyle(storyRoot).padding).toBe("0px");
    await expect(getComputedStyle(storyRoot).overflow).toBe("hidden");
    await expect(
      getComputedStyle(canvasElement.ownerDocument.body).overflow,
    ).toBe("hidden");
  }
  await expect(getComputedStyle(demo).overflow).toBe("hidden");

  const panel = canvas.getByTestId(testId);
  const expectedHost = {
    "middle-top-tabs": "workspace-tabs",
    "stacked-tabs": "workspace-stacked-tabs",
    "left-sidebar": "workspace-sidebar",
    "right-sidebar": "workspace-sidebar",
    "bottom-panel": "workspace-bottom-panel-group",
    "sidebar-group": "workspace-sidebar-group",
  }[layout];
  const host = panel.closest(
    `[data-ui-component="${expectedHost}"]`,
  ) as HTMLElement | null;
  await expect(host).not.toBeNull();

  const expectedSurface = {
    "middle-top-tabs": "body",
    "stacked-tabs": "body",
    "left-sidebar": "left-sidebar",
    "right-sidebar": "right-sidebar",
    "bottom-panel": "bottom-panel",
    "sidebar-group": "right-sidebar",
  }[layout];
  const surfaceHost = panel.closest(
    "[data-workspace-surface]",
  ) as HTMLElement | null;
  if (!surfaceHost) throw new Error(`Missing workspace surface for ${layout}`);
  await expect(surfaceHost).toHaveAttribute(
    "data-workspace-surface",
    expectedSurface,
  );

  const viewHost = panel.closest(
    '[data-ui-component="workspace-view-host"]',
  ) as HTMLElement | null;
  if (!viewHost) throw new Error(`Missing WorkspaceViewHost for ${layout}`);
  const storyWindow = canvasElement.ownerDocument.defaultView;
  if (!storyWindow) throw new Error("Missing Storybook preview window");
  const directSidebar = layout === "left-sidebar" || layout === "right-sidebar";
  const paintHost = directSidebar
    ? surfaceHost
    : (canvasElement.querySelector(
        '[data-workspace-surface="body"]',
      ) as HTMLElement | null);
  if (!paintHost) throw new Error(`Missing expected paint host for ${layout}`);
  const viewBackground = storyWindow.getComputedStyle(viewHost).backgroundColor;
  await expect(viewBackground).toBe(
    storyWindow.getComputedStyle(paintHost).backgroundColor,
  );
  const panelBackground = storyWindow.getComputedStyle(panel).backgroundColor;
  if (kind === "ai-chat") {
    await expect(panelBackground).not.toBe("rgba(0, 0, 0, 0)");
  } else {
    await expect(panelBackground).toBe(viewBackground);
  }
  const stickyChrome = panel.querySelector<HTMLElement>(
    '[data-ui-part="chrome"]',
  );
  if (stickyChrome) {
    await expect(
      storyWindow.getComputedStyle(stickyChrome).backgroundColor,
    ).toBe(viewBackground);
  }

  if (directSidebar) {
    await expect(host).toHaveAttribute(
      "data-workspace-sidebar-side",
      layout === "left-sidebar" ? "left" : "right",
    );
  }
  if (layout === "bottom-panel" || layout === "sidebar-group") {
    const groupHeader = host?.querySelector<HTMLElement>(
      'button[data-ui-part="panel-header"]',
    );
    await expect(groupHeader).not.toBeNull();
    await expect(groupHeader).toBeVisible();
    await expect(groupHeader).toHaveAttribute("aria-expanded", "true");
  }

  return within(panel);
}
