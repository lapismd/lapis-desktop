// SPDX-License-Identifier: Apache-2.0
import type { Component } from "svelte";
import type { CatalogGroup } from "../../../lib/ai/catalog/types.ts";
import type { CatalogKindKey } from "../../../lib/ai/catalog/tree.ts";
import BookOpenIcon from "@lucide/svelte/icons/book-open";
import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
import FolderClosedIcon from "@lucide/svelte/icons/folder-closed";
import PuzzleIcon from "@lucide/svelte/icons/puzzle";
import TerminalIcon from "@lucide/svelte/icons/terminal";
import UserIcon from "@lucide/svelte/icons/user";
import WrenchIcon from "@lucide/svelte/icons/wrench";
export function ownerIcon(group: CatalogGroup): Component {
  if (group.kind === "user") return UserIcon;
  if (group.kind === "diagnostics") return CircleAlertIcon;
  if (group.kind === "folders") return FolderClosedIcon;
  return PuzzleIcon;
}

export function kindIcon(kind: CatalogKindKey): Component {
  if (kind === "tools") return WrenchIcon;
  if (kind === "commands") return TerminalIcon;
  if (kind === "skills") return BookOpenIcon;
  return CircleAlertIcon;
}

export function kindLabel(kind: CatalogKindKey): string {
  if (kind === "tools") return "Tools";
  if (kind === "commands") return "Commands";
  if (kind === "skills") return "Skills";
  return "Diagnostics";
}
