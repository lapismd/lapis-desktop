<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import NotesDemo from "../../NotesDemo.svelte";
  import { bindHistoryFixture } from "../context.ts";
  import "../../../../src/components/repository/repository-review-identifiers.css";
  import "../../../../src/components/repository/repository-picker-options.css";
  import "../../../../src/components/repository/repository-column-chrome.css";
  import { HistoryReviewView } from "./history-review-view.ts";
  import { OperationReviewView } from "./review-view.ts";
  import { reviewFixture } from "./review-fixture.ts";
  import { operation } from "../fixture.ts";
  let {
    selected = true,
    initialTab = "operations",
    initialRevision,
    initialEvolution = false,
  }: {
    selected?: boolean;
    initialTab?: "history" | "operations";
    initialRevision?: string;
    initialEvolution?: boolean;
  } = $props();
  const fixture = untrack(reviewFixture);
  let root: HTMLDivElement, app: App | undefined;
  onMount(() => {
    let opened = false;
    const observer = new MutationObserver(() => {
      if (opened || !app || !root.querySelector('[data-notes-ready="true"]'))
        return;
      opened = true;
      const workspace = getWorkspaceHostBinding(app.workspace).controller
        .workspace;
      const layout = workspace.getLayout();
      workspace.changeLayout({
        ...layout,
        left: { ...layout.left, width: "0" },
        right: { ...layout.right, width: "0" },
      });
      workspace.openLeaf(
        "repository-history-review",
        { operation },
        { active: initialTab === "history" },
      );
      workspace.openLeaf(
        "repository-oplog-review",
        {},
        { active: initialTab === "operations" },
      );
      observer.disconnect();
    });
    observer.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      app?.workspace.unregisterView("repository-oplog-review");
      app?.workspace.unregisterView("repository-history-review");
    };
  });
</script>

<div bind:this={root} class="repository-review-demo" data-repository-fixture>
  <NotesDemo
    createRepository={(owner) => {
      app = owner;
      bindHistoryFixture(root, { app: owner, fixture });
      owner.workspace.registerView(
        "repository-history-review",
        (leaf) =>
          new HistoryReviewView(
            leaf,
            fixture.reader,
            initialRevision,
            fixture.operations,
            fixture.evolution,
            initialEvolution,
            fixture.workspaces,
          ),
      );
      owner.workspace.registerView(
        "repository-oplog-review",
        (leaf) =>
          new OperationReviewView(
            leaf,
            fixture.reader,
            fixture.commits,
            selected,
            fixture.workspaces,
          ),
      );
      return { reader: fixture.reader, close: () => fixture.close() };
    }}
  />
</div>

<style>
  .repository-review-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
