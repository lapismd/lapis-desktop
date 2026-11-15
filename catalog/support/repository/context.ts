import type { App } from "@lapis-notes/api";
import type { historyFixture } from "./fixture.ts";
type Context = { app: App; fixture: ReturnType<typeof historyFixture> };
const contexts = new WeakMap<HTMLElement, Context>();
export function bindHistoryFixture(root: HTMLElement, context: Context): void {
  contexts.set(root, context);
}
export function historyContext(canvas: HTMLElement): Context {
  const root = canvas.querySelector<HTMLElement>("[data-repository-fixture]");
  const context = root && contexts.get(root);
  if (!context) throw new Error("Repository fixture is not ready");
  return context;
}

/** Observe the production view's public state after its header selectors retire. */
export function repositoryView(
  canvas: HTMLElement,
  type = "repository-history",
) {
  const leaf = historyContext(canvas).app.workspace.getLeavesOfType(type)[0];
  if (!leaf) throw new Error(`Repository view is not open: ${type}`);
  return leaf.view;
}
