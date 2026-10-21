// SPDX-License-Identifier: Apache-2.0
// Retained complete shell geometry assertions, lapis-plugins ee20d366.
import { expect, waitFor } from "storybook/test";
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
export async function assertStackedComposer(panel: HTMLElement): Promise<void> {
  await waitFor(() => {
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
    const frame = panel.querySelector<HTMLElement>(".ai-session-shell");
    const body =
      panel.querySelector<HTMLElement>(".ai-session-thread-body") ?? panel;
    const bar =
      panel.querySelector<HTMLElement>(".ai-session-footer") ?? footer!;
    expect(surface!.getBoundingClientRect().height).toBeGreaterThan(
      body.clientHeight * 0.7,
    );
    expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      footer!.getBoundingClientRect().top + 2,
    );
    const clearance = parseFloat(
      getComputedStyle(
        frame ??
          panel.querySelector<HTMLElement>(
            '[data-testid="ai-transcript-panel"]',
          )!,
      ).paddingBottom,
    );
    if (frame) {
      const content = bar.closest('[data-ui-part="body-content"]')!;
      expect(
        Math.abs(
          bar.getBoundingClientRect().bottom -
            content.getBoundingClientRect().bottom,
        ),
      ).toBeLessThan(2);
      // The embedded AppShell owns the footer; there is no reserved outer gap.
      expect(clearance).toBe(0);
      expect(bar.getBoundingClientRect().height).toBe(32);
      expect(footer!.getBoundingClientRect().height).toBeLessThanOrEqual(32);
    } else {
      expect(
        Math.abs(
          bar.getBoundingClientRect().bottom +
            clearance -
            panel.getBoundingClientRect().bottom,
        ),
      ).toBeLessThan(2);
      expect(footer!.getBoundingClientRect().height).toBe(48);
    }
    expect(surface!.scrollHeight).toBeLessThanOrEqual(surface!.clientHeight);
  });
}

export async function assertNoMessageOverlap(
  panel: HTMLElement,
): Promise<void> {
  await assertStackedComposer(panel);
  const messages = panel.querySelectorAll(
    'article[aria-label^="Message from"]',
  );
  expect(messages.length).toBeGreaterThan(0);
}
