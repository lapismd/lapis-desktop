import type { App } from "@lapis-notes/api";
import { TerminalSessions } from "./terminal-sessions.ts";

export type TerminalFactory = (app: App) => TerminalSessions;
const active = new WeakMap<App, TerminalSessions>();
const bindings = new WeakMap<App, TerminalFactory>();
export function bindTerminal(app: App, factory: TerminalFactory): void {
  bindings.set(app, factory);
}
export function createOwnedTerminal(app: App): TerminalSessions {
  const factory = bindings.get(app);
  if (!factory) throw new Error("Terminal client is not bound to this App");
  const sessions = factory(app);
  active.set(app, sessions);
  return sessions;
}
export function reportTerminalError(app: App, error: unknown): void {
  app.notifications.notify({
    id: "terminal-error",
    title: "Terminal",
    message: error instanceof Error ? error.message : String(error),
    severity: "error",
    source: "terminal",
  });
}

export function prepareTerminalLeave(app: App, mode: "close" | "reload"): void {
  active.get(app)?.prepareLeave(mode);
}
