<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
</script>

<div class="jsonl-loading" role="status" aria-label="Loading records">
  {#each [0, 1, 2] as record (record)}
    <div class="jsonl-loading__record" aria-hidden="true">
      <div class="jsonl-loading__header">
        <Skeleton style="height:0.8rem;width:50%" /><Skeleton
          style="height:0.7rem;width:4rem"
        />
      </div>
      <Skeleton style="height:0.8rem;width:75%" /><Skeleton
        style="height:0.8rem;width:60%"
      /><Skeleton style="height:0.7rem;width:5rem" />
    </div>
  {/each}
</div>

<style>
  .jsonl-loading {
    display: grid;
    gap: 1rem;
    padding: 1rem;
  }
  .jsonl-loading__record {
    display: grid;
    gap: 0.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }
  .jsonl-loading__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
</style>
