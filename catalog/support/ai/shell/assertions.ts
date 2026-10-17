// SPDX-License-Identifier: Apache-2.0
// Retained complete shell geometry assertions, lapis-plugins ee20d366.
import { expect } from "storybook/test";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { shellFixture } from "./fixture.ts";
export function demoApp(element: HTMLElement): App {
  return shellFixture(element).app;
}
export function mainAiLeaves(app: App): WorkspaceLeaf[] {
  const leaves: WorkspaceLeaf[] = [];
  app.workspace.iterateRootLeaves((leaf) => {
    if (leaf.view.getViewType() === "ai") leaves.push(leaf);
  });
  return leaves;
}
export function releaseAiInitialization(element: HTMLElement) {
  shellFixture(element).releaseModels();
}
export function assertStackedComposer(panel: HTMLElement): void {
  const layout = panel.querySelector(
    '[data-ui-component="ai-chat-layout"]',
  ) as HTMLElement | null;
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const shell = panel.querySelector(
    '[data-ui-part="scroll-shell"]',
  ) as HTMLElement | null;
  const composerBody = panel.querySelector(
    '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
  ) as HTMLElement | null;
  const empty = panel.querySelector(
    '[data-ui-part="empty-state"]',
  ) as HTMLElement | null;
  expect(layout).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(shell).not.toBeNull();
  expect(composerBody).not.toBeNull();
  expect(empty).not.toBeNull();
  expect(getComputedStyle(dock!).position).toBe("relative");
  expect(parseFloat(getComputedStyle(panel).paddingBottom)).toBe(0);
  const panelBox = panel.getBoundingClientRect();
  const layoutBox = layout!.getBoundingClientRect();
  const dockBox = dock!.getBoundingClientRect();
  const shellBox = shell!.getBoundingClientRect();
  const emptyBox = empty!.getBoundingClientRect();
  expect(layoutBox.height).toBeGreaterThan(panelBox.height * 0.8);
  expect(shellBox.height).toBeGreaterThanOrEqual(
    layoutBox.height - dockBox.height - 2,
  );
  expect(emptyBox.height).toBeGreaterThan(shellBox.height * 0.7);
  expect(shellBox.bottom).toBeLessThanOrEqual(dockBox.top + 2);
  expect(
    dockBox.bottom - composerBody!.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(20);
  expect(dockBox.bottom).toBeLessThanOrEqual(panelBox.bottom + 2);
  expect(dockBox.top).toBeGreaterThan(panelBox.top + panelBox.height * 0.4);
}

export function assertNoMessageOverlap(panel: HTMLElement): void {
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const viewport = panel.querySelector(
    '[data-ui-part="scroll-area-viewport"]',
  ) as HTMLElement | null;
  const messages = panel.querySelectorAll(
    '[data-ui-component="ai-chat-message"]',
  );
  const last = messages[messages.length - 1] as HTMLElement | undefined;
  expect(dock).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(last).toBeDefined();
  expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    dock!.getBoundingClientRect().top + 2,
  );
  expect(getComputedStyle(viewport!).overflowY).toMatch(/auto|scroll/);
}
