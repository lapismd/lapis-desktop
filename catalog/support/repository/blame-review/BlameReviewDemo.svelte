<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { RepositoryPlugin } from "../../../../src/components/repository/repository-plugin.ts";
  import NotesDemo from "../../NotesDemo.svelte";
  import { bindHistoryFixture } from "../context.ts";
  import { operationFixture } from "../operations.ts";
  import { operation, revision } from "../fixture.ts";
  import { BlameReviewView } from "./blame-review-view.ts";
  import {
    attachLargeBlame,
    largeBlamePath,
    largeBlameContents,
  } from "./large-fixture.ts";
  import {
    installBlameReviewActions,
    openBlameReview,
  } from "./title-actions.ts";

  let {
    initialView = "blame",
    sample = "large",
  }: { initialView?: "blame" | "editor"; sample?: "small" | "large" } =
    $props();

  const fixture = untrack(() => operationFixture("blame-progress"));
  const large = untrack(() => sample === "large");
  if (large) attachLargeBlame(fixture.reader);
  let root: HTMLDivElement, app: App | undefined;
  onMount(() => {
    let opened = false;
    let removeActions: (() => void) | undefined;
    const observer = new MutationObserver(() => {
      if (opened || !app || !root.querySelector('[data-notes-ready="true"]'))
        return;
      opened = true;
      const plugin = app.plugins.plugins.get("repository-history");
      if (!(plugin instanceof RepositoryPlugin)) return;
      const actions = installBlameReviewActions(plugin);
      removeActions = actions.dispose;
      if (initialView !== "editor") {
        const owner = app;
        void openBlameReview(owner, {
          operation,
          commit: revision,
          path: large ? largeBlamePath : "Welcome.md",
        })
          .then(() => {
            const workspace = getWorkspaceHostBinding(owner.workspace)
              .controller.workspace;
            const layout = workspace.getLayout();
            layout.left.width = "0";
            layout.right.width = "0";
            workspace.changeLayout(layout);
          })
          .catch((error) => plugin.report(error));
      }
      observer.disconnect();
    });
    observer.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      removeActions?.();
      app?.workspace.unregisterView("repository-file-blame-review");
    };
  });
</script>

<div bind:this={root} class="blame-review-demo" data-repository-fixture>
  <NotesDemo
    files={large ? { [largeBlamePath]: largeBlameContents } : {}}
    createRepository={(owner) => {
      app = owner;
      bindHistoryFixture(root, { app: owner, fixture });
      owner.workspace.registerView("repository-file-blame-review", (leaf) => {
        const plugin = owner.plugins.plugins.get("repository-history");
        if (!(plugin instanceof RepositoryPlugin))
          throw new Error("Repository plugin is not ready");
        return new BlameReviewView(leaf, plugin);
      });
      return { reader: fixture.reader, close: () => fixture.close() };
    }}
  />
</div>

<style>
  .blame-review-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
