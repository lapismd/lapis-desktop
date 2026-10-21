// SPDX-License-Identifier: Apache-2.0
import cursorIcon from "./assets/cursor.svg";
import opencodeIcon from "./assets/opencode.svg";
import codexIcon from "./assets/codex.svg";
/** Captured identity only; an image never indicates provider availability or admission. */
export function agentAvatar(agent: string | undefined) {
  return (
    {
      codex: codexIcon,
      cursor: cursorIcon,
      opencode: opencodeIcon,
      local: "/lapis-logo.svg",
    } as Record<string, string>
  )[agent?.toLowerCase() ?? ""];
}
