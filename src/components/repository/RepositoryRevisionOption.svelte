<script lang="ts">
  import type { LocalGraphCommit } from "@lapismd/jj-history";
  import { RepositoryIdentifiers } from "@lapismd/repository-ui/jj";
  import { encodeJjChangeId } from "../../lib/repository/graph/repository-log-graph.ts";
  import RepositoryParentSummary from "./RepositoryParentSummary.svelte";
  import RepositoryComparisonTime from "./RepositoryComparisonTime.svelte";
  let {
    target,
    commit,
    copyText,
  }: {
    target: string;
    commit?: LocalGraphCommit;
    copyText(value: string): Promise<void>;
  } = $props();
</script>

<div role="gridcell" class="repository-review-revision-option">
  <RepositoryParentSummary
    {target}
    author={commit?.author.name}
    email={commit?.author.email}
    description={commit?.description}
  />
  <span
    class="repository-review-revision-ids"
    role="presentation"
    onpointerdown={(event) => event.stopPropagation()}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    }}
  >
    <RepositoryIdentifiers
      {copyText}
      commitId={target}
      changeId={commit ? encodeJjChangeId(commit.change_id) : ""}
      placement="inline"
    />
  </span>
  <RepositoryComparisonTime
    timestamp={commit ? Number(commit.author.timestamp.millis) : undefined}
  />
</div>

<style>
  .repository-review-revision-option {
    display: flex;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    flex: 1 1 0;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
  }
  .repository-review-revision-ids {
    display: inline-flex;
    flex: none;
  }
</style>
