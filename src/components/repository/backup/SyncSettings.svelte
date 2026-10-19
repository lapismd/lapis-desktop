<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import GitMerge from "@lucide/svelte/icons/git-merge";
  import type { SyncController } from "../../../lib/repository/sync-controller.ts";
  import type { SyncState } from "../../../lib/repository/sync.ts";
  let {
    controller,
    setEnabled,
    onReview,
  }: {
    controller: SyncController;
    setEnabled(enabled: boolean): Promise<void>;
    onReview(): void;
  } = $props();
  let snapshot = $state<SyncState>({
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  });
  onMount(() => controller.subscribe((next) => (snapshot = next)));
  const descriptions = {
    ready:
      "Local history is safe. Connected backups synchronize in the background.",
    fetching: "Fetching and merging remote history…",
    applying: "Applying merged files safely…",
    publishing: "Publishing the selected backup branch…",
    conflicts:
      "Local and remote edits need review. Current files have been preserved.",
    attention:
      "Synchronization needs attention. Your local history remains available.",
    paused:
      "Remote synchronization is paused. Local history remains independent.",
  };
</script>

<Card.Root>
  <Card.Header
    ><Card.Title>Automatic synchronization</Card.Title><Card.Description
      >{descriptions[snapshot.phase]}</Card.Description
    ></Card.Header
  >
  <Card.Content>
    <div class="sync-actions">
      <Field.Field orientation="horizontal" data-disabled={snapshot.busy}
        ><Switch
          id="automatic-vault-sync"
          checked={snapshot.enabled}
          disabled={snapshot.busy}
          onCheckedChange={(checked) => void setEnabled(checked)}
        /><Field.Label for="automatic-vault-sync"
          >Synchronize the connected backup automatically</Field.Label
        ></Field.Field
      >
      <Button
        variant="outline"
        size="sm"
        disabled={snapshot.busy || !snapshot.enabled}
        onclick={() => controller.run()}
        ><RefreshCw data-icon="inline-start" />Sync now</Button
      >
      {#if snapshot.proposal?.conflicts.length}<Button
          variant="outline"
          size="sm"
          disabled={snapshot.busy}
          onclick={onReview}
          ><GitMerge data-icon="inline-start" />Review {snapshot.proposal
            .conflicts.length} conflicts</Button
        >{/if}
      {#if snapshot.recovery}<Button
          variant="outline"
          size="sm"
          disabled={snapshot.busy}
          onclick={() => controller.keepCurrent()}>Keep current files</Button
        >{/if}
    </div>
    {#if snapshot.lastSuccess}<p>
        Last synchronized {new Date(snapshot.lastSuccess).toLocaleTimeString()}
      </p>{/if}
  </Card.Content>
</Card.Root>

<style>
  .sync-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    margin: 0.75rem 0 0;
  }
</style>
