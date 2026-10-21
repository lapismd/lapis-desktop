// SPDX-License-Identifier: Apache-2.0
import type { MemoryScope } from "./types.ts";
import { normalizeConversationScope } from "../conversations/paths.ts";

export function memoryFolder(value = "Memory"): string {
  const path = value.trim().replace(/\/$/u, "");
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part.startsWith("."))
  )
    throw new Error("Choose a visible folder within this vault for memory.");
  if (normalizeConversationScope(path) !== path)
    throw new Error("Memory folder must be a vault-relative path.");
  return path;
}

export function memoryTimezone(
  value = Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  new Intl.DateTimeFormat("en", { timeZone: value }).format();
  return value;
}

export function memoryDate(at: string | Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

export function scopeDirectory(folder: string, scope: MemoryScope): string {
  const root = memoryFolder(folder);
  if (scope.kind === "user") return `${root}/User`;
  if (scope.kind === "workspace") return root;
  if (
    !scope.projectDir ||
    normalizeConversationScope(scope.projectDir) !== scope.projectDir ||
    scope.projectDir.split("/").some((part) => part.startsWith("."))
  )
    throw new Error("Project memory scope is invalid");
  return `${root}/Projects/${scope.projectDir}`;
}

export function noteScope(
  folder: string,
  path: string,
): MemoryScope | undefined {
  if (!path.startsWith(`${folder}/`)) return;
  const relative = path.slice(folder.length + 1);
  const filename = relative.split("/").at(-1)!;
  if (filename !== "MEMORY.md" && !/^\d{4}-\d{2}-\d{2}\.md$/u.test(filename))
    return;
  const directory = relative.slice(0, -(filename.length + 1));
  if (!relative.includes("/")) return { kind: "workspace" };
  if (directory === "User") return { kind: "user" };
  if (directory.startsWith("Projects/") && directory.length > 9) {
    const scope: MemoryScope = {
      kind: "project",
      projectDir: directory.slice(9),
    };
    try {
      scopeDirectory(folder, scope);
      return scope;
    } catch {
      return;
    }
  }
}
