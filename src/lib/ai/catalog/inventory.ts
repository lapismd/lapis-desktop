// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI policy; see ../NOTICE.md.
import type { Vault } from "@lapis-notes/api";
import type {
  RegisteredAppSkillSource,
  RegisteredAppSlashCommand,
  SkillSourceKind,
} from "@lapis-notes/api/agent-skills";
import type { RegisteredAppTool } from "@lapis-notes/api/agent-tools";
import { SlashCommandCatalog } from "../commands/catalog.ts";
import { CommandDiscovery } from "../commands/discovery.ts";
import type { UserAgentsCommandStore } from "../commands/user-agents.ts";
import {
  isAppToolEnabled,
  type AiPluginSettings,
} from "../settings/ai-settings.ts";
import type { LoadedAppSkill } from "../skills/types.ts";
import type {
  CatalogCommandRow,
  CatalogGroup,
  CatalogSkillRow,
  CatalogToolRow,
} from "./types.ts";

import { listInventorySkills } from "./inventory-skills.ts";

const SOURCE_RANK: Record<SkillSourceKind, number> = {
  folder: 5,
  vault: 4,
  user: 3,
  extension: 2,
  programmatic: 2,
  bundled: 1,
};

export interface CollectAiCatalogInput {
  tools: readonly RegisteredAppTool[];
  commands: readonly RegisteredAppSlashCommand[];
  registeredSkills?: readonly RegisteredAppSkillSource[];
  vault: Vault;
  bundled: readonly LoadedAppSkill[];
  settings: AiPluginSettings;
  pluginLabel: (pluginId: string) => string;
  userAgents?: UserAgentsCommandStore;
  scopeDir?: string;
}

export async function collectAiCatalog(
  input: CollectAiCatalogInput,
): Promise<CatalogGroup[]> {
  const groups = new Map<string, CatalogGroup>();
  const pluginGroup = (pluginId: string): CatalogGroup => {
    const existing = groups.get(pluginId);
    if (existing) return existing;
    const created: CatalogGroup = {
      id: pluginId,
      label: input.pluginLabel(pluginId),
      kind: "plugin",
      tools: [],
      commands: [],
      skills: [],
      diagnostics: [],
    };
    groups.set(pluginId, created);
    return created;
  };

  for (const registered of input.tools) {
    pluginGroup(registered.owner.pluginId).tools.push({
      kind: "tool",
      name: registered.tool.name,
      description: registered.tool.description,
      effect: registered.tool.effect,
      pluginId: registered.owner.pluginId,
      enabled: isAppToolEnabled(
        { name: registered.tool.name, owner: registered.owner },
        input.settings,
      ),
      owner: registered.owner,
    });
  }

  const discoveredCommands = await new CommandDiscovery({
    vault: input.vault,
    userAgents: input.userAgents,
  }).discover(input.scopeDir ?? "");
  const catalog = new SlashCommandCatalog();
  catalog.replaceFileCommands(
    discoveredCommands.commands,
    discoveredCommands.overlays,
  );
  const reserved = catalog.list().filter((command) => command.source === "app");
  const overlayByName = new Map(
    discoveredCommands.overlays.map((command) => [command.name, command]),
  );
  for (const command of reserved) {
    const overlay = overlayByName.get(command.name);
    pluginGroup("ai").commands.push({
      kind: "command",
      name: command.name,
      description: command.description,
      source: "app",
      path: overlay?.path,
    });
  }
  const reservedNames = new Set(reserved.map((command) => command.name));
  for (const registered of input.commands) {
    if (reservedNames.has(registered.command.name)) continue;
    pluginGroup(registered.ownerPluginId).commands.push({
      kind: "command",
      name: registered.command.name,
      description: registered.command.description,
      source: "extension",
    });
  }
  for (const command of discoveredCommands.commands) {
    const row: CatalogCommandRow = {
      kind: "command",
      name: command.name,
      description: command.description,
      source: command.source,
      path: command.path,
    };
    if (command.source === "user") {
      ensureNamedGroup(groups, "user", "User", "user").commands.push(row);
    } else {
      ensureNamedGroup(groups, "folders", "Folders", "folders").commands.push(
        row,
      );
    }
  }

  const { skills, diagnostics } = await listInventorySkills(
    input.vault,
    input.bundled,
    input.registeredSkills ?? [],
  );
  const winners = new Map<string, CatalogSkillRow>();
  for (const skill of skills) {
    const current = winners.get(skill.name);
    if (!current || SOURCE_RANK[skill.source] > SOURCE_RANK[current.source]) {
      winners.set(skill.name, skill);
    }
  }
  for (const skill of skills) {
    const row = {
      ...skill,
      shadowed: winners.get(skill.name) !== skill,
    };
    if (skill.source === "folder" || skill.source === "vault") {
      ensureNamedGroup(groups, "folders", "Folders", "folders").skills.push(
        row,
      );
    } else if (skill.source === "user") {
      ensureNamedGroup(groups, "user", "User", "user").skills.push(row);
    } else {
      pluginGroup(skill.pluginId ?? "ai").skills.push(row);
    }
  }

  const listed = [...groups.values()].filter(
    (group) =>
      group.tools.length +
        group.commands.length +
        group.skills.length +
        group.diagnostics.length >
      0,
  );
  listed.sort((left, right) => {
    const order = (kind: CatalogGroup["kind"]) =>
      kind === "plugin" ? 0 : kind === "folders" ? 1 : kind === "user" ? 2 : 3;
    return (
      order(left.kind) - order(right.kind) ||
      left.label.localeCompare(right.label)
    );
  });
  const allDiagnostics = [...diagnostics, ...discoveredCommands.diagnostics];
  if (allDiagnostics.length > 0) {
    listed.push({
      id: "diagnostics",
      label: "Diagnostics",
      kind: "diagnostics",
      tools: [],
      commands: [],
      skills: [],
      diagnostics: allDiagnostics,
    });
  }
  return listed;
}

function ensureNamedGroup(
  groups: Map<string, CatalogGroup>,
  id: string,
  label: string,
  kind: CatalogGroup["kind"],
): CatalogGroup {
  const existing = groups.get(id);
  if (existing) return existing;
  const created: CatalogGroup = {
    id,
    label,
    kind,
    tools: [],
    commands: [],
    skills: [],
    diagnostics: [],
  };
  groups.set(id, created);
  return created;
}

export function catalogToolRows(
  groups: readonly CatalogGroup[],
): CatalogToolRow[] {
  return groups.flatMap((group) => group.tools);
}
