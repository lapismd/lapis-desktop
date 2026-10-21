// SPDX-License-Identifier: Apache-2.0
import type {
  App,
  WorkspaceCustomSetting,
  WorkspaceSettingsSection,
} from "@lapis-notes/api";
import type { AiSettingsStore } from "../../../lib/ai/settings/settings-store.ts";
import {
  memoryDate,
  scopeDirectory,
} from "../../../lib/ai/memory/note-paths.ts";
import { conversationMemoryScope } from "../../../lib/ai/memory/paths.ts";
import { revealConversationScope } from "../../../lib/ai/conversations/reveal-scope.ts";
import MemoryFolderField from "./MemoryFolderField.svelte";

export function addMemorySettingsActions(
  section: WorkspaceSettingsSection,
  app: App,
  settings: AiSettingsStore,
  currentScope: () => string,
): void {
  const group = section.fields?.find((field) => field.id === "ai.memory");
  if (group?.type !== "group") return;
  const folder = group.fields.find((field) => field.id === "ai.memoryFolder");
  if (folder)
    Object.assign(folder, {
      type: "custom",
      component: MemoryFolderField,
      presentation: "full-width",
      app,
    } satisfies Partial<WorkspaceCustomSetting> & { app: App });
  const open = async (daily: boolean) => {
    const current = settings.get();
    const directory = scopeDirectory(
      current.memoryFolder,
      conversationMemoryScope(currentScope()),
    );
    const date = memoryDate(new Date(), current.memoryTimezone);
    const path = `${directory}/${daily ? date : "MEMORY"}.md`;
    await app.vault.mkpath(directory);
    if (!app.vault.getFileByPath(path))
      await app.fileManager.createFile(
        path,
        daily ? `# ${date}\n` : "# Memory\n",
      );
    await app.workspace.openLinkText(path, "");
  };
  group.fields.splice(
    1,
    0,
    {
      id: "ai.openMemoryFolder",
      type: "action",
      title: "Review memory",
      description: "Browse all memory notes in the vault Explorer.",
      label: "Open folder",
      icon: "folder",
      variant: "outline",
      run: () => revealConversationScope(app, settings.get().memoryFolder),
    },
    {
      id: "ai.openMemoryToday",
      type: "action",
      title: "Daily memory",
      description:
        "Open today's dated note of observations for the current scope.",
      label: "Open today's note",
      variant: "outline",
      run: () => open(true),
    },
    {
      id: "ai.openCuratedMemory",
      type: "action",
      title: "Curated memory",
      description:
        "Open lasting facts and preferences collected for the current scope.",
      label: "Open MEMORY.md",
      variant: "outline",
      run: () => open(false),
    },
  );
}
