<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { historyFixture, operation, revision } from "./fixture.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { HistorySearchHit } from "../../../src/lib/repository/search.ts";
  let {
    scenario = "ready",
  }: { scenario?: "ready" | "failed" | "loading" | "empty" | "older" } =
    $props();
  const fixture = untrack(() => historyFixture());
  let root: HTMLDivElement,
    attempts = 0;
  let release: (() => void) | undefined;
  const hit: HistorySearchHit = {
    revision: {
      checkpoint: {
        operation,
        commit: revision,
        change_id: "aa".repeat(16),
        description:
          "Restore the old meeting notes\n\nRetain decisions before rewriting the plan.",
        timestamp_millis: 1792252800000,
      },
      author: "Ada Lovelace",
      email: "dev@lapis.md",
    },
    path: "Welcome.md",
    line: 12,
    excerpt: "The original launch plan included a local-first notes vault.",
  };
</script>

<div bind:this={root} data-repository-fixture class="search-demo">
  {#if scenario === "loading"}<button class="finish" onclick={() => release?.()}
      >Finish fixture search</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        search: {
          indexed: {
            async start() {
              return { generation: 1, indexed: 42, omitted: 2, complete: true };
            },
            async status() {
              return { generation: 1, indexed: 42, omitted: 2, complete: true };
            },
            async query(request) {
              root.dataset.searchQuery = JSON.stringify(request.expression);
              if (scenario === "failed" && attempts++ === 0)
                throw new Error("Saved history index is unavailable");
              if (scenario === "loading")
                await new Promise<void>((resolve) => (release = resolve));
              const offset = Number(request.cursor ?? 0);
              if (scenario === "older" && offset < 40)
                return {
                  hits: [],
                  next: String(offset + 1),
                  status: {
                    generation: 1,
                    indexed: 42,
                    omitted: 0,
                    complete: true,
                  },
                  reset: false,
                };
              const path = JSON.stringify(request.expression).includes(
                '"checkpoint"',
              )
                ? null
                : (hit.path ?? null);
              return {
                hits:
                  scenario === "empty"
                    ? []
                    : [
                        {
                          record: {
                            revision: hit.revision,
                            parents: [],
                            path,
                            content_id: path ? "de".repeat(20) : null,
                            deleted: false,
                            previous: null,
                            unavailable: false,
                          },
                          excerpt: hit.excerpt,
                          line: hit.line ?? null,
                        },
                      ],
                next: null,
                status: {
                  generation: 1,
                  indexed: 42,
                  omitted: scenario === "ready" ? 2 : 0,
                  complete: true,
                },
                reset: false,
              };
            },
            async context(request) {
              root.dataset.historyContext = JSON.stringify(request);
              return {
                text: hit.excerpt,
                start: 0,
                end: 1,
                before: false,
                after: false,
              };
            },
          },
          async page(request) {
            root.dataset.searchQuery = JSON.stringify(request.query);
            if (scenario === "failed" && attempts++ === 0)
              throw new Error("Saved history index is unavailable");
            if (scenario === "loading")
              await new Promise<void>((resolve) => (release = resolve));
            const offset = request.cursor?.revision ?? 0;
            if (scenario === "older" && offset < 40)
              return {
                hits: [],
                next: { anchor: revision, revision: offset + 1 },
                checkpoints: offset + 1,
                unindexed: 0,
              };
            return {
              hits:
                scenario === "empty"
                  ? []
                  : [
                      {
                        ...hit,
                        path:
                          request.query.text === "checkpoint" ? null : hit.path,
                      },
                    ],
              next: null,
              checkpoints: offset + 1,
              unindexed: scenario === "ready" ? 2 : 0,
            };
          },
        },
        restore: {
          async preview(checkpoint, path) {
            return {
              checkpoint,
              path,
              expected: "d".repeat(64),
              bytes: 146,
              deleted: false,
            };
          },
          async apply(request) {
            root.dataset.restoredFile = request.path;
          },
          async previewVault(checkpoint) {
            return {
              checkpoint,
              expected: "e".repeat(64),
              added: 1,
              modified: 2,
              deleted: 0,
            };
          },
          async applyVault(request) {
            root.dataset.restoredCheckpoint = request.checkpoint;
          },
        },
        close: async () => {
          release?.();
          await fixture.close();
        },
      };
    }}
  />
</div>

<style>
  .search-demo {
    height: 100vh;
    min-height: 36rem;
  }
  .finish {
    position: fixed;
    top: 0.5rem;
    right: 1rem;
    z-index: 1000;
  }
</style>
