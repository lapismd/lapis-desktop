import type { App } from "@lapis-notes/api";
import { TerminalPlugin } from "../terminal/terminal-plugin.ts";
import { AiPlugin } from "../ai/plugin/ai-plugin.ts";
import { terminalEnabledByDefault } from "../../lib/terminal/terminal-preferences.ts";
import { aiEnabledByDefault } from "../../lib/ai/plugin/preferences.ts";
import {
  bindTerminal,
  prepareTerminalLeave,
  type TerminalFactory,
} from "../../lib/terminal/terminal-binding.ts";
import {
  bindAi,
  prepareAiLeave,
  type AiFactory,
} from "../../lib/ai/plugin/services.ts";

/** Composition stays beside NotesWorkspace; reusable policy does not import UI. */
export function notesBundledPlugins(
  app: App,
  terminal?: TerminalFactory,
  ai?: AiFactory,
) {
  if (terminal) bindTerminal(app, terminal);
  const unbind = ai ? bindAi(app, ai) : () => {};
  return {
    async register(): Promise<void> {
      if (terminal)
        app.plugins.registerStaticPlugins([
          {
            plugin: TerminalPlugin,
            required: false,
            enabledByDefault: await terminalEnabledByDefault(app),
          },
        ]);
      if (ai)
        app.plugins.registerStaticPlugins([
          {
            plugin: AiPlugin,
            required: false,
            enabledByDefault: await aiEnabledByDefault(app),
          },
        ]);
    },
    prepareLeave(mode: "close" | "reload"): void {
      prepareTerminalLeave(app, mode);
      prepareAiLeave(app, mode);
    },
    dispose: unbind,
  };
}
