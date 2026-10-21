// SPDX-License-Identifier: Apache-2.0
import type { Plugin } from "@lapis-notes/api";
import type { AiApplication } from "../../../lib/ai/plugin/application.ts";
import { seedBundledSkills } from "../../../lib/ai/skills/seed.ts";
import { seedReservedCommands } from "../../../lib/ai/commands/seed.ts";
import { conversationMemoryScope } from "../../../lib/ai/memory/paths.ts";
import { confirmForgetDerivedMemory } from "../memory/forget-confirmation.ts";
export function registerAiCommands(plugin: Plugin, host: AiApplication): void {
  const notice = (message: string) =>
    plugin.app.notifications.notify({ source: "ai", message });
  const add = (id: string, name: string, callback: () => Promise<unknown>) =>
    plugin.addCommand({
      id,
      name,
      callback: () => {
        if (!host.active) return;
        void host.operations
          .track(callback())
          .catch((error) => host.report(error));
      },
    });
  add("update-bundled-skills", "Update bundled skills", async () => {
    await seedBundledSkills(plugin.app.vault, { overwrite: true });
    host.skills.invalidate();
  });
  add("update-reserved-commands", "Update reserved commands", async () => {
    if (host.userAgents)
      await seedReservedCommands(host.userAgents, { overwrite: true });
    await host.refreshFileCommands();
  });
  add("rebuild-memory-index", "Rebuild memory index", async () => {
    const result = await host.memory.rebuild();
    notice(
      `Memory index rebuilt (${result.conversations} conversations, ${result.episodes} episodes)`,
    );
  });
  add(
    "preview-memory-consolidation",
    "Preview memory consolidation",
    async () => {
      const preview = await host.memory.previewConsolidation(
        conversationMemoryScope(host.currentConversationScope()),
      );
      notice(
        `${preview.proposals} memory proposal${preview.proposals === 1 ? "" : "s"} ready from ${preview.candidateIds.length} candidate${preview.candidateIds.length === 1 ? "" : "s"}`,
      );
    },
  );
  add("run-memory-consolidation", "Run memory consolidation", async () => {
    const result = await host.memory.consolidate(
      conversationMemoryScope(host.currentConversationScope()),
    );
    notice(
      `Memory consolidation wrote ${result.written} revision${result.written === 1 ? "" : "s"}; ${result.needsReview} need review`,
    );
  });
  add("show-memory-status", "Show memory status", async () => {
    const [sources, candidates, jobs] = await Promise.all([
      plugin.app.appDatabase.listMemorySourceStates(),
      plugin.app.appDatabase.queryMemoryCandidates({ limit: 10_000 }),
      plugin.app.appDatabase.listMemoryJobs(),
    ]);
    const active = jobs.filter((job) => job.status === "running").length;
    notice(
      `Memory: ${sources.length} conversation source${sources.length === 1 ? "" : "s"}, ${candidates.length} candidate${candidates.length === 1 ? "" : "s"}, ${active} active job${active === 1 ? "" : "s"}`,
    );
  });
  async function latest(patterns: string[], missing: string) {
    const files = new Map(
      patterns
        .flatMap((pattern) => plugin.app.vault.getFilesByGlob(pattern))
        .map((file) => [file.path, file]),
    );
    const file = [...files.values()].sort(
      (a, b) => b.stat.mtime - a.stat.mtime,
    )[0];
    if (!file) {
      notice(missing);
      return;
    }
    await plugin.app.workspace.openLinkText(file.path, "");
  }
  add("open-latest-memory-note", "Open latest memory note", () =>
    latest(
      [`${host.getSettings().memoryFolder}/**/*.md`],
      "No memory notes yet",
    ),
  );
  add("open-latest-memory-review", "Open latest memory review", () =>
    latest([".lapis/memory/reviews/*.md"], "No memory review reports yet"),
  );
  add(
    "forget-current-conversation-memory",
    "Forget derived memory from current conversation",
    async () => {
      const location = host.currentAiConversation();
      if (!location) {
        notice("Open an AI conversation before forgetting its memory");
        return;
      }
      const preview = await host.memory.previewForgetConversation(location);
      if (
        !preview.episodeRefs.length &&
        !preview.candidateIds.length &&
        !preview.memoryIds.length
      ) {
        notice("This conversation has no derived memory to forget");
        return;
      }
      if (
        !(await confirmForgetDerivedMemory(
          plugin.app,
          preview,
          host.lifetime.signal,
        ))
      )
        return;
      const result = await host.memory.forgetConversation(location);
      notice(
        `Forgot derived conversation memory and retracted ${result.retracted} record${result.retracted === 1 ? "" : "s"}; the transcript was preserved`,
      );
    },
  );
}
