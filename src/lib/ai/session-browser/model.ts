// SPDX-License-Identifier: Apache-2.0
/** Notes-owned presentation of the source/session catalog; never a runtime grant. */
export type SessionItem = {
  id: string;
  title: string;
  /** Optional vault-relative launch note or folder, shown below the title. */
  path?: string;
  profile: string;
  group: string;
  updatedAt: string;
  status?: string;
  harness?: string;
};
export function profileLabel(profile: string): string {
  if (profile.startsWith("codex-cli-")) return "Codex CLI";
  if (profile.startsWith("codex-desktop-")) return "Codex Desktop";
  if (profile === "cursor-jsonl-v1") return "Cursor";
  if (profile === "opencode-sqlite-v1") return "OpenCode";
  return profile;
}

export type SavedSessionVersion = {
  id: string;
  sequence: number;
  updatedAt: string;
  incomplete?: boolean;
  entries?: import("../conversations/types.ts").TranscriptEntry[];
};
export type SavedSessionGroup = {
  id: string;
  title: string;
  profile: string;
  group: string;
  versions: SavedSessionVersion[];
};

export function profileHarness(
  profile: string,
): "codex" | "cursor" | "opencode" {
  return profile.startsWith("cursor-")
    ? "cursor"
    : profile.startsWith("opencode-")
      ? "opencode"
      : "codex";
}
