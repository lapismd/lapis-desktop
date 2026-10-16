// SPDX-License-Identifier: AGPL-3.0-or-later
// Setting identities and descriptions adapted from lapis-plugin-terminal.
import type { TerminalPlugin } from "./terminal-plugin.ts";
import {
  TERMINAL_CWD_SETTING_ID,
  TERMINAL_SHELL_SETTING_ID,
} from "../../lib/terminal/terminal-settings.ts";

export function registerTerminalSettings(plugin: TerminalPlugin): void {
  plugin.registerSettingsSection({
    section: {
      id: "terminal",
      title: "Terminal",
      description: "Interactive shell start directory and shell binary.",
      icon: "square-terminal",
      order: 45,
      navigationGroupId: "core-plugins",
      sourcePluginId: plugin.id,
      fields: [
        {
          id: TERMINAL_SHELL_SETTING_ID,
          type: "string",
          title: "Shell path",
          description:
            "Absolute shell binary. Leave empty to use your login shell.",
          default: "",
          placeholder: "/bin/zsh",
        },
        {
          id: TERMINAL_CWD_SETTING_ID,
          type: "string",
          title: "Start directory",
          description:
            "Directory inside this vault for new sessions. Leave empty to use the vault root.",
          default: "",
          placeholder: "notes",
        },
      ],
    },
    source: {
      get: (id) =>
        plugin.getSettings()[
          id === TERMINAL_SHELL_SETTING_ID ? "shell" : "cwd"
        ],
      set: async (id, value) => {
        if (id !== TERMINAL_SHELL_SETTING_ID && id !== TERMINAL_CWD_SETTING_ID)
          throw new Error("Unknown Terminal setting");
        await plugin.updateSettings({
          [id === TERMINAL_SHELL_SETTING_ID ? "shell" : "cwd"]: String(
            value ?? "",
          ),
        });
      },
      subscribe: (listener) => {
        const ref = plugin.app.configuration.on(
          "plugin-data-updated",
          (event) => {
            if (event.pluginId !== plugin.id) return;
            plugin.hydrateSettings(event.value);
            listener();
          },
        );
        return () => plugin.app.configuration.offref(ref);
      },
    },
  });
}
