import type { App } from "@lapis-notes/api";
import { TerminalPlugin } from "../terminal/terminal-plugin.ts";
import { AiPlugin } from "../ai/plugin/ai-plugin.ts";
import { RepositoryPlugin } from "../repository/repository-plugin.ts";
import {
  bindRepository,
  prepareRepositoryLeave,
  type RepositoryFactory,
} from "../../lib/repository/services.ts";
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
  repository?: RepositoryFactory,
) {
  if (terminal) bindTerminal(app, terminal);
  const unbind = ai ? bindAi(app, ai) : () => {};
  const unbindHistory = repository ? bindRepository(app, repository) : () => {};
  return {
    async register(): Promise<void> {
      if (repository)
        app.plugins.registerStaticPlugins([
          { plugin: RepositoryPlugin, required: false, enabledByDefault: true },
        ]);
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
      prepareRepositoryLeave(app, mode);
    },
    dispose() {
      unbindHistory();
      unbind();
    },
  };
}
