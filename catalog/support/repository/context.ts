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
