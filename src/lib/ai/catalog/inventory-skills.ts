// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI policy; see ../NOTICE.md.
import type { Vault } from "@lapis-notes/api";
import type {
  RegisteredAppSkillSource,
  SkillSourceKind,
} from "@lapis-notes/api/agent-skills";
import { BUNDLED_SKILL_NAMES } from "../skills/bundled/research.ts";
import { parseSkillMarkdown, SkillParseError } from "../skills/parser.ts";
import type { LoadedAppSkill } from "../skills/types.ts";
import type { CatalogSkillRow, CatalogDiagnosticRow } from "./types.ts";

export async function listInventorySkills(
  vault: Vault,
  bundled: readonly LoadedAppSkill[],
  registeredSkills: readonly RegisteredAppSkillSource[],
): Promise<{ skills: CatalogSkillRow[]; diagnostics: CatalogDiagnosticRow[] }> {
  const skills: CatalogSkillRow[] = [];
  const diagnostics: CatalogDiagnosticRow[] = [];
  for (const file of vault.getFilesByGlob("**/.agents/skills/**/SKILL.md")) {
    if (file.path.includes("/scripts/") || file.path.includes("/references/")) {
      continue;
    }
    const source = skillSourceForPath(file.path);
    try {
      const loaded = parseSkillMarkdown(await vault.cachedRead(file), {
        path: file.path,
        source,
        root: file.path.replace(/\/SKILL\.md$/u, ""),
      });
      skills.push({
        kind: "skill",
        name: loaded.name,
        description: loaded.description,
        source,
        path: file.path,
        pluginId: source === "bundled" ? "ai" : undefined,
        shadowed: false,
        userInvocable: loaded.userInvocable,
      });
    } catch (error) {
      diagnostics.push({
        path: file.path,
        message:
          error instanceof SkillParseError
            ? error.message
            : "Skill could not be parsed.",
      });
    }
  }
  for (const file of vault.getFilesByGlob(".agents/user/skills/**/SKILL.md")) {
    if (file.path.includes("/scripts/") || file.path.includes("/references/")) {
      continue;
    }
    try {
      const loaded = parseSkillMarkdown(await vault.cachedRead(file), {
        path: file.path,
        source: "user",
        root: file.path.replace(/\/SKILL\.md$/u, ""),
      });
      skills.push({
        kind: "skill",
        name: loaded.name,
        description: loaded.description,
        source: "user",
        path: file.path,
        shadowed: false,
        userInvocable: loaded.userInvocable,
      });
    } catch (error) {
      diagnostics.push({
        path: file.path,
        message:
          error instanceof SkillParseError
            ? error.message
            : "Skill could not be parsed.",
      });
    }
  }
  for (const skill of bundled) {
    if (
      skills.some((row) => row.name === skill.name && row.source === "bundled")
    ) {
      continue;
    }
    skills.push({
      kind: "skill",
      name: skill.name,
      description: skill.description,
      source: skill.source,
      pluginId: "ai",
      shadowed: false,
      userInvocable: skill.userInvocable,
    });
  }
  for (const registered of registeredSkills) {
    if (registered.kind !== "programmatic" || !registered.skill) continue;
    skills.push({
      kind: "skill",
      name: registered.skill.name,
      description: registered.skill.description,
      source: "programmatic",
      pluginId: registered.ownerPluginId,
      shadowed: false,
      userInvocable: registered.skill.userInvocable !== false,
    });
  }
  return { skills, diagnostics };
}

export function skillSourceForPath(path: string): SkillSourceKind {
  if (path.startsWith(".agents/user/skills/")) return "user";
  if (path.startsWith(".agents/skills/")) {
    const name = path.split("/")[2] ?? "";
    return BUNDLED_SKILL_NAMES.has(name) ? "bundled" : "vault";
  }
  return "folder";
}
