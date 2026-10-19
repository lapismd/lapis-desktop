// SPDX-License-Identifier: Apache-2.0
import { View, type WorkspaceLeaf } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import { createChatApp } from "../app-fixture.ts";
import { registerCatalogCleanup } from "../../lifecycle.ts";
import CapturedSessionReview from "../../../../src/components/ai/sessions/CapturedSessionBrowser.svelte";
import type { SavedSessionGroup as ReviewSession } from "../../../../src/lib/ai/session-browser/model.ts";
import { sampleCapture } from "../imports/fixture.ts";
import { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../../src/lib/ai/conversations/memory-transcript-store.ts";
import ImportedConversation from "../../../../src/components/ai/imports/ImportedConversation.svelte";
import type { ConversationSnapshot } from "../../../../src/lib/ai/conversations/types.ts";
export type CaptureScenario =
  | "ready"
  | "empty"
  | "loading"
  | "incomplete"
  | "persisted"
  | "read-failure";
export function createCaptureFixture(scenario: CaptureScenario) {
  const base = createChatApp(() => {});
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  const panels = new Set<ReturnType<typeof mount>>(),
    pending = new Set<Promise<unknown>>();
  let sessions: ReviewSession[] = [];
  let saved: ConversationSnapshot | undefined,
    older: ConversationSnapshot | undefined;
  const type = "ai-captured-layout-review";
  function track(work: Promise<unknown>) {
    pending.add(work);
    void work.finally(() => pending.delete(work)).catch(console.error);
  }
  class CaptureView extends View {
    panel?: ReturnType<typeof mount>;
    getViewType() {
      return type;
    }
    getDisplayText() {
      return "Captured history";
    }
    getIcon() {
      return "history";
    }
    protected async onOpen() {}
    protected async onClose() {}
    onload() {
      this.panel = saved
        ? mount(ImportedConversation, {
            target: this.containerEl,
            props: {
              app: base.app,
              repository,
              snapshot: saved,
              onDispose: track,
            },
          })
        : mount(CapturedSessionReview, {
            target: this.containerEl,
            props: {
              sessions,
              loading: scenario === "loading",
              initialSelection: scenario !== "empty",
            },
          });
      panels.add(this.panel);
    }
    onunload() {
      if (this.panel) {
        panels.delete(this.panel);
        track(unmount(this.panel));
        this.panel = undefined;
      }
    }
  }
  const ready = (async () => {
    await base.ready;
    if (scenario !== "empty" && scenario !== "loading") {
      const titles = [
        "Add MIT license",
        "Review the weekly note structure",
        "Improve repository history navigation",
        "Research note links",
        "Tidy the capture import flow",
        "Document the vault release checklist",
      ];
      sessions = await Promise.all(
        titles.map(async (title, i) => {
          const versions = await Promise.all(
            [3, 2, 1].map(async (sequence) => {
              const capture = structuredClone(sampleCapture);
              capture.source.profile =
                i % 3 === 1 ? "codex-desktop-0.159.2" : "codex-cli-0.156.1";
              capture.source.sessionKey = String(i + 1).repeat(64);
              capture.source.snapshotKey = String(sequence).repeat(64);
              capture.entries[0] = {
                ...capture.entries[0],
                type: "message",
                role: "user",
                text: title,
              };
              if (i === 0) {
                capture.entries[1] = {
                  ...capture.entries[1],
                  type: "tool",
                  name: "read_file",
                  state: "unknown",
                  input: '{"path":"<workspace>/package.json"}',
                  output: JSON.stringify(
                    {
                      name: "notes-demo",
                      private: true,
                      license: "UNLICENSED",
                    },
                    null,
                    2,
                  ),
                };
              }
              const updatedAt = new Date(
                Date.parse("2026-10-19T11:00:00.000Z") -
                  i * 3600000 -
                  (3 - sequence) * 1200000,
              ).toISOString();
              const last = capture.entries.at(-1)!;
              capture.entries[capture.entries.length - 1] = {
                ...last,
                type: "message",
                role: "assistant",
                createdAt: updatedAt,
                text:
                  i === 0
                    ? `## License added\n\nThe repository now includes an MIT license and the README links to it.\n\n### Changes\n\n| File | Change |\n| --- | --- |\n| LICENSE | Added the standard MIT text |\n| README.md | Linked the license |\n\n\`\`\`diff\n--- a/README.md\n+++ b/README.md\n@@ -1,2 +1,4 @@\n # Notes demo\n-All rights reserved.\n+\n+## License\n+This project is licensed under the MIT License.\n\`\`\`\n\n### Review notes\n\n- Kept the existing copyright attribution.\n- Checked the package metadata against the license file.\n- No runtime or configuration changes were needed.\n\nThis is local captured version ${sequence}.`
                    : `## ${title}\n\n${last.type === "message" ? last.text : "Recorded conversation"}\n\nSaved version ${sequence}.`,
              };
              const persisted =
                scenario === "persisted" || scenario === "read-failure"
                  ? (
                      await repository.imports.save(
                        capture,
                        i < 4 ? "Repository Review" : "Research notes",
                      )
                    ).snapshot
                  : undefined;
              if (i === 0 && sequence === 3) saved = persisted;
              if (i === 0 && sequence === 1) older = persisted;
              const plan = persisted
                ? { entries: persisted.transcript }
                : await repository.imports.preview(capture, "");
              return {
                id: `${i}-${sequence}`,
                sequence,
                updatedAt,
                entries: plan.entries,
                incomplete:
                  scenario === "incomplete" && i === 0 && sequence === 3,
              };
            }),
          );
          return {
            id: `session-${i}`,
            title,
            profile: i % 3 === 1 ? "Codex Desktop" : "Codex CLI",
            group: i < 4 ? "Repository Review" : "Research notes",
            versions,
          };
        }),
      );
    }
    if (scenario === "read-failure" && older) {
      const read = repository.read.bind(repository);
      let failed = false;
      repository.read = async (location) => {
        if (
          !failed &&
          location.conversationId === older!.location.conversationId
        ) {
          failed = true;
          throw new Error(
            "The saved version could not be read. Its current preview is retained.",
          );
        }
        return read(location);
      };
    }
    base.app.workspace.registerView(
      type,
      (leaf: WorkspaceLeaf) => new CaptureView(leaf),
    );
    await base.app.workspace.changeLayout({
      main: {
        id: "main",
        type: "split",
        direction: "horizontal",
        sizes: [100],
        children: [
          {
            id: "capture-tabs",
            type: "tabs",
            currentTab: 0,
            children: [
              {
                id: "capture-preview",
                type: "leaf",
                state: {
                  type,
                  state: {},
                  title: "Captured history",
                  icon: "history",
                },
              },
            ],
          },
        ],
      },
      left: {
        id: "left",
        type: "split",
        direction: "vertical",
        sizes: [],
        width: "0px",
        children: [],
      },
      right: {
        id: "right",
        type: "split",
        direction: "vertical",
        sizes: [],
        width: "0px",
        children: [],
      },
      bottom: {
        id: "bottom",
        type: "tabs",
        currentTab: 0,
        children: [],
        height: "0px",
      },
      floating: [],
      active: "capture-preview",
    });
  })();
  let closing: Promise<void> | undefined;
  const close = () =>
    (closing ??= (async () => {
      await ready;
      for (const panel of panels) {
        panels.delete(panel);
        await unmount(panel);
      }
      while (pending.size) await Promise.allSettled([...pending]);
      base.app.workspace.unregisterView(type);
      await base.close();
    })());
  const unregister = registerCatalogCleanup(close);
  return {
    app: base.app,
    ready,
    close: async () => {
      unregister();
      await close();
    },
  };
}
