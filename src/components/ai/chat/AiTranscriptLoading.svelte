<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  let { composer = true }: { composer?: boolean } = $props();
</script>

<div class="transcript-loading" role="status" aria-label="Loading conversation">
  <div class="loading-body" aria-hidden="true">
    {#each [0, 1] as row (row)}
      <div class="loading-message">
        <Skeleton style="width:1.5rem;height:1.5rem;border-radius:50%" />
        <div class="loading-lines">
          <Skeleton style="width:42%;height:0.8rem" /><Skeleton
            style="width:90%;height:0.8rem"
          /><Skeleton style="width:76%;height:0.8rem" /><Skeleton
            style="width:55%;height:0.8rem"
          />
        </div>
      </div>
    {/each}
  </div>
  {#if composer}<div class="loading-composer" aria-hidden="true">
      <Skeleton style="width:60%;height:1rem" /><Skeleton
        style="width:100%;height:5rem"
      />
    </div>{/if}
</div>

<style>
  .transcript-loading {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    gap: 2rem;
    padding: 1.5rem;
  }
  .loading-body {
    display: grid;
    gap: 2rem;
    width: min(100%, 62rem);
    margin-inline: auto;
  }
  .loading-message {
    display: flex;
    gap: 0.75rem;
  }
  .loading-lines {
    display: grid;
    gap: 0.75rem;
    flex: 1;
  }
  .loading-composer {
    display: grid;
    gap: 0.75rem;
    margin-top: auto;
  }
</style>
