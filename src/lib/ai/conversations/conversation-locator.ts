// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI orchestration; see ../NOTICE.md.
import { normalizePortableVaultPath } from "./paths.ts";
import type { ConversationLocation } from "./types.ts";

export function relocateConversationLocation(
  location: ConversationLocation,
  oldPath: string,
  newPath: string,
): ConversationLocation | null {
  const previous = normalizePortableVaultPath(oldPath, {
    allowRoot: true,
    label: "Previous vault path",
  });
  const next = normalizePortableVaultPath(newPath, {
    allowRoot: true,
    label: "New vault path",
  });
  if (
    location.scopeDir !== previous &&
    !location.scopeDir.startsWith(`${previous}/`)
  ) {
    return null;
  }
  const suffix = location.scopeDir.slice(previous.length).replace(/^\//u, "");
  return {
    ...location,
    scopeDir: [next, suffix].filter(Boolean).join("/"),
  };
}
