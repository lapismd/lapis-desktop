<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { OperationState } from "../../lib/repository/operation-state.ts";
  import type { OperationController } from "../../lib/repository/operation-controller.ts";
  import { timestampLabel } from "../../lib/repository/history-state.ts";
  let {
    state,
    controller,
    onHistory,
  }: {
    state: OperationState;
    controller: OperationController;
    onHistory(operation: string): void;
  } = $props();
</script>

<div class="operation-detail">
  {#if state.selected}
    {@const node = state.selected}
    <dl>
      <dt>View</dt>
      <dd><code>{node.view}</code></dd>
      <dt>Started</dt>
      <dd>{timestampLabel(node.start.millis)}</dd>
      {#if node.workspace}<dt>Workspace</dt>
        <dd>{node.workspace}</dd>{/if}
      {#if node.is_snapshot}<dt>Kind</dt>
        <dd>Snapshot</dd>{/if}
    </dl>
    <Button variant="outline" size="sm" onclick={() => onHistory(node.id)}
      >Inspect in History</Button
    >
    {#if state.detail}
      {@const detail = state.detail}
      {#if detail.status !== "difference"}
        <p role="status">
          {detail.status === "root"
            ? "This is the root operation."
            : "Choose a parent to compare this operation."}
        </p>
      {:else}
        <section aria-label="Operation changes">
          <h4>Revision changes</h4>
          <p>
            {detail.visible_commits.added.length} added · {detail
              .visible_commits.removed.length} removed
          </p>
          {#each [["Added", detail.visible_commits.added], ["Removed", detail.visible_commits.removed]] as const as [title, ids]}
            {#if ids.length}<h5>{title}</h5>
              {#each ids as id (id)}<code>{id}</code>{/each}{/if}
          {/each}
          <h4>View changes</h4>
          <p>
            {detail.view.heads.added.length} heads added · {detail.view.heads
              .removed.length} heads removed
          </p>
          {#each [["Bookmarks", detail.view.local_bookmarks], ["Tags", detail.view.local_tags], ["Remote views", detail.view.remote_views], ["Git refs", detail.view.git_refs], ["Git heads", detail.view.git_heads], ["Workspaces", detail.view.workspaces]] as const as [title, changes]}
            {#if changes.length}<h5>{title}</h5>
              <ul>
                {#each changes as change (change.name)}<li>
                    {change.name}
                  </li>{/each}
              </ul>{/if}
          {/each}
        </section>
      {/if}
    {:else if state.busy}<p role="status">Loading operation changes…</p>
    {:else if node.parents.length > 1 && !state.parent}<p role="status">
        Choose a parent to compare this operation.
      </p>
    {:else}<p role="status">Operation changes are unavailable.</p>
      <Button size="sm" onclick={() => controller.select(node)}
        >Retry operation</Button
      >
    {/if}
  {:else}<p>Select an operation to inspect its changes.</p>{/if}
</div>

<style>
  .operation-detail {
    padding: 0.75rem;
    min-width: 0;
    font-size: 0.875rem;
  }
  h4,
  h5 {
    font-size: 0.875rem;
    margin: 0.5rem 0;
  }
  code {
    display: block;
    overflow-wrap: anywhere;
    font-size: 0.75rem;
  }
  dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.375rem 0.75rem;
  }
  dt,
  p {
    color: var(--muted-foreground);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
</style>
