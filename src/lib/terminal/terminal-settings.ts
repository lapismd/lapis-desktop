// SPDX-License-Identifier: AGPL-3.0-or-later
// Adapted from lapis-plugin-terminal; see NOTICE.md.
export const TERMINAL_SHELL_SETTING_ID = "terminal.shell";
export const TERMINAL_CWD_SETTING_ID = "terminal.cwd";

export type TerminalPluginSettings = {
  shell: string;
  cwd: string;
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalPluginSettings = {
  shell: "",
  cwd: "",
};

function trimSetting(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseTerminalPluginSettings(
  stored: unknown,
): TerminalPluginSettings {
  const record =
    stored && typeof stored === "object"
      ? (stored as Record<string, unknown>)
      : {};
  return {
    shell: trimSetting(record.shell ?? record[TERMINAL_SHELL_SETTING_ID]),
    cwd: trimSetting(record.cwd ?? record[TERMINAL_CWD_SETTING_ID]),
  };
}

export type TerminalSettingsStore = {
  readonly settings: TerminalPluginSettings;
  hydrate(stored: unknown): void;
  replace(next: Partial<TerminalPluginSettings>): void;
};

export function createTerminalSettingsStore(
  initial?: unknown,
): TerminalSettingsStore {
  let settings = parseTerminalPluginSettings(initial);

  return {
    get settings() {
      return settings;
    },
    hydrate(stored) {
      settings = parseTerminalPluginSettings(stored);
    },
    replace(next) {
      settings = parseTerminalPluginSettings({ ...settings, ...next });
    },
  };
}
