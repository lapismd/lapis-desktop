<script lang="ts">
  import { onMount } from "svelte";
  import BackupCard from "./BackupCard.svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import GitMerge from "@lucide/svelte/icons/git-merge";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import type { AdoptionController } from "../../../lib/repository/adoption-controller.ts";
  import type { AdoptionState } from "../../../lib/repository/adoption.ts";
  let { controller }: { controller: AdoptionController } = $props();
  let snapshot = $state<AdoptionState>({ busy: true, phase: "loading" });
  onMount(() => {
    const stop = controller.subscribe((value) => (snapshot = value));
    void controller.refresh();
    return stop;
  });
</script>

<section aria-label="Original repository history" aria-busy={snapshot.busy}>
  <BackupCard
    title="Original repository history"
    Icon={GitMerge}
    description="Keep the vault’s existing JJ repository independent, or import its recorded Git ancestry into automatic history."
  >
    {#snippet actions()}<Button
        variant="ghost"
        size="icon-sm"
        disabled={snapshot.busy}
        aria-label="Refresh original history"
        onclick={() => controller.refresh()}><RefreshCw /></Button
      >{/snippet}
    {#if !snapshot.data && snapshot.busy}<div
        class="loading"
        role="status"
        aria-label="Loading original history"
      >
        <Skeleton style="height:2rem;width:70%" /><Skeleton
          style="height:1rem;width:90%"
        />
      </div>
    {:else if snapshot.request}<p>
        An original import needs reconciliation. Resume that request or stop
        tracking it. Stopping does not remove ancestry already imported.
      </p>
      <div class="actions">
        <Button disabled={snapshot.busy} onclick={() => controller.resume()}
          >Resume original import</Button
        ><Button
          variant="outline"
          disabled={snapshot.busy}
          onclick={() => controller.stop()}>Stop tracking import</Button
        >
      </div>
    {:else if snapshot.data?.source_unavailable}<p>
        Original history is unavailable. Refresh after the original repository
        is accessible again.
      </p>
    {:else if snapshot.data?.source}<p>
        Current vault files stay in place. The original repository’s operations
        and evolution history remain available through the history source
        selector.
      </p>
      <div class="actions">
        <Button disabled={snapshot.busy} onclick={() => controller.adopt()}
          ><GitMerge data-icon="inline-start" />Import recorded history</Button
        >
      </div>
    {:else if snapshot.data}<p>
        No separate original JJ repository was found in this vault.
      </p>
    {:else}<p>Refresh to discover recorded repository history.</p>{/if}
    {#snippet footer()}<p>
        This action requires automatic local history to be enabled. It does not
        change remote synchronization settings.
      </p>{/snippet}
  </BackupCard>
</section>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .loading {
    display: grid;
    gap: 0.75rem;
  }
  p {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted-foreground);
  }
</style>
