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
  const surface = panel.querySelector<HTMLElement>(
    '[data-ui-component="transcript"]',
  );
  const footer = panel.querySelector<HTMLElement>(
    '[data-ui-component="transcript-footer"]',
  );
  const viewport = panel.querySelector<HTMLElement>(
    '.ui-transcript-viewport > [data-ui-part="scroll-area-viewport"]',
  );
  const composer = panel.querySelector<HTMLElement>(
    "[data-transcript-composer]",
  );
  expect(surface).not.toBeNull();
  expect(footer).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(composer).not.toBeNull();
  expect(surface!.getBoundingClientRect().height).toBeGreaterThan(
    panel.clientHeight * 0.7,
  );
  expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    footer!.getBoundingClientRect().top + 2,
  );
  const clearance = parseFloat(
    getComputedStyle(
      panel.querySelector<HTMLElement>('[data-testid="ai-transcript-panel"]')!,
    ).paddingBottom,
  );
  expect(
    Math.abs(
      footer!.getBoundingClientRect().bottom +
        clearance -
        panel.getBoundingClientRect().bottom,
    ),
  ).toBeLessThan(2);
  expect(footer!.getBoundingClientRect().height).toBe(48);
  expect(surface!.scrollHeight).toBeLessThanOrEqual(surface!.clientHeight);
}

export function assertNoMessageOverlap(panel: HTMLElement): void {
  assertStackedComposer(panel);
  const messages = panel.querySelectorAll(
    '[data-chat-item][data-kind="message"]',
  );
  expect(messages.length).toBeGreaterThan(0);
}
