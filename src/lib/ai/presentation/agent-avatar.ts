// SPDX-License-Identifier: Apache-2.0
import codexIcon from "./assets/codex.svg";
/** Captured identity only; an image never indicates provider availability or admission. */
export function agentAvatar(agent: string | undefined) {
  return agent?.toLowerCase() === "codex" ? codexIcon : undefined;
}
