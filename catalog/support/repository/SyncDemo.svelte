<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { SyncProposal } from "../../../src/lib/repository/sync.ts";
  let {
    scenario = "clean",
  }: { scenario?: "clean" | "conflicts" | "offline" | "pending" | "unknown" } =
    $props();
  let root: HTMLDivElement;
  const fixture = untrack(() => operationFixture());
  const checkpoint = (commit: string) => ({
    commit: commit.repeat(40),
    operation: "a".repeat(128),
    change_id: "c".repeat(32),
    description: "Automatic vault backup",
    timestamp_millis: 1792300000000,
  });
  let attempts = 0,
    writes = 0,
    pushes = 0;
  let conflicted = untrack(() => scenario === "conflicts");
  let release: (() => void) | undefined;
  let finished = false;
  let original = "";
  let applied = false;
  const status = {
    phase: "ready" as const,
    error: null,
    checkpoint: checkpoint("b"),
  };
  const configuration = {
    account: "account",
    project: "lapis-fixture/notes",
    target: {
      url: "https://github.com/lapis-fixture/notes.git",
      branch: "main",
    },
    canPush: true,
  };
</script>

<div bind:this={root} data-repository-fixture class="sync-demo">
  {#if scenario === "pending"}<button
      onclick={() => {
        finished = true;
        release?.();
      }}>Finish remote sync</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        backup: {
          detach: async () => {},
          start: async () => status,
          capture: async () => status,
          stop: async () => {
            release?.();
          },
        },
        forges: {
          inventory: async () => ({
            accounts: [
              {
                id: "account",
                api_url: "https://api.github.com",
                login: "lapis-fixture",
                name: "Lapis",
                email: "dev@lapis.md",
                avatar_url: null,
                method: "pat",
                available: true,
              },
            ],
            oauth_available: false,
            keychain_supported: true,
            authorization: null,
          }),
          command: async () => {
            throw Error("Use account examples");
          },
          openAuthorization: async () => {},
        },
        remote: {
          status: async () => ({
            revision: 1,
            configuration,
            checkpoint: checkpoint("d"),
          }),
          configure: async () => {
            throw Error("Use setup examples");
          },
          disconnect: async () => {
            throw Error("Use setup examples");
          },
          fetch: async () => ({
            revision: 1,
            configuration,
            checkpoint: checkpoint("d"),
          }),
          preview: async () => ({
            checkpoint: "d".repeat(40),
            expected: "tree",
            added: 1,
            modified: 0,
            deleted: 0,
          }),
          restore: async () => {},
          keepCurrent: async () => {},
        },
        sync: {
          async prepare() {
            attempts++;
            if (scenario === "pending" && !finished)
              await new Promise<void>((resolve) => (release = resolve));
            if (scenario === "offline" && attempts === 1)
              throw Error("Backup is offline; local history is safe");
            if (applied) return null;
            return {
              local: checkpoint("b"),
              incoming: checkpoint("d"),
              candidate: checkpoint(conflicted ? "e" : "f"),
              conflicts: conflicted ? ["Welcome.md"] : [],
            } satisfies SyncProposal;
          },
          preview: async (candidate) => ({
            checkpoint: candidate,
            expected: "saved-tree",
            added: 0,
            modified: 1,
            deleted: 0,
          }),
          async apply(request) {
            original ||= request.request_id;
            root.dataset.syncOriginal = original;
            applied = true;
            applied = true;
            writes++;
            root.dataset.syncWrites = String(writes);
            if (scenario === "unknown" && writes === 1)
              throw Error("Sync response was lost");
          },
          async publish() {
            pushes++;
            root.dataset.syncPushes = String(pushes);
            return "complete" as const;
          },
          conflict: async (_, path) => ({
            path,
            terms: [
              "# Local note\n\nEdit on this device.\n",
              "# Shared note\n\nOriginal paragraph.\n",
              "# Remote note\n\nEdit from another device.\n",
            ].map((text, id) => ({
              id,
              text,
              kind: "text",
              role: id === 1 ? "remove" : "add",
              executable: false,
            })),
          }),
          async resolve(_, _path, choice) {
            if (choice.kind === "text")
              root.dataset.syncResolution = choice.text;
            conflicted = false;
            root.dataset.syncResolved = "true";
            return checkpoint("f");
          },
        },
        close: () => fixture.close(),
      };
    }}
  />
</div>

<style>
  .sync-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
