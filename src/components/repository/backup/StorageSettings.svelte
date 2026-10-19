<script lang="ts">
  import { onMount } from "svelte";
  import BackupCard from "./BackupCard.svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as ToggleGroup from "@lapismd/design-core/shadcn/toggle-group";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import FolderCog from "@lucide/svelte/icons/folder-cog";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import type { StorageController } from "../../../lib/repository/storage-controller.ts";
  import type {
    StorageState,
    StorageLocation,
  } from "../../../lib/repository/storage.ts";
  let { controller }: { controller: StorageController } = $props();
  let snapshot = $state<StorageState>({
    busy: true,
    phase: "loading",
    needsReload: false,
  });
  let selected = $state<StorageLocation>("external");
  onMount(() => {
    const stop = controller.subscribe((value) => {
      snapshot = value;
      if (value.data) selected = value.data.location;
    });
    void controller.refresh();
    return stop;
  });
</script>

<section aria-label="History storage" aria-busy={snapshot.busy}>
  <BackupCard
    title="History storage"
    Icon={FolderCog}
    description="Keep automatic history in application data, or store it in the vault’s root .jj directory."
  >
    {#snippet actions()}<Button
        variant="ghost"
        size="icon-sm"
        disabled={snapshot.busy}
        aria-label="Refresh history storage"
        onclick={() => controller.refresh()}><RefreshCw /></Button
      >{/snippet}
    {#if !snapshot.data && snapshot.busy}
      <div
        class="storage-loading"
        role="status"
        aria-label="Loading history storage"
      >
        <Skeleton style="height:2rem;width:14rem;max-width:100%" /><Skeleton
          style="height:1rem;width:80%"
        />
      </div>
    {:else if snapshot.data?.pending}
      <p>
        A history storage move is unfinished. Resume the original move, or keep
        the previous location if installation has not completed.
      </p>
      <div class="storage-actions">
        <Button disabled={snapshot.busy} onclick={() => controller.recover()}
          >Resume move and reload</Button
        ><Button
          variant="outline"
          disabled={snapshot.busy}
          onclick={() => controller.rollback()}>Keep previous location</Button
        >
      </div>
    {:else if snapshot.data}
      <Field.Field data-disabled={snapshot.busy || undefined}>
        <Field.Label>Repository metadata location</Field.Label>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          size="sm"
          aria-label="Repository metadata location"
          value={selected}
          disabled={snapshot.busy || snapshot.needsReload}
          onValueChange={(value) => {
            if (value === "external" || value === "colocated") selected = value;
          }}
        >
          <ToggleGroup.Item value="external">Application data</ToggleGroup.Item>
          <ToggleGroup.Item value="colocated">Vault root (.jj)</ToggleGroup.Item
          >
        </ToggleGroup.Root>
        <Field.Description
          >{selected === "external"
            ? "Default. No JJ or Git metadata is added to the vault."
            : "Advanced. The vault contains its own .jj metadata. Existing repository data is preserved and will not be overwritten."}</Field.Description
        >
      </Field.Field>
      {#if snapshot.needsReload}<div class="storage-actions">
          <Button disabled={snapshot.busy} onclick={() => controller.reload()}
            ><RefreshCw data-icon="inline-start" />Reload vault</Button
          >
        </div>
      {:else if selected !== snapshot.data.location}<div
          class="storage-actions"
        >
          <Button
            disabled={snapshot.busy}
            onclick={() => controller.change(selected)}
            ><FolderCog data-icon="inline-start" />Move history and reload</Button
          >
        </div>{/if}
    {:else}<p>Refresh to load the vault’s history storage settings.</p>{/if}
    {#snippet footer()}<p>
        Moving preserves local history and recovery records. The vault reloads
        after the move.
      </p>{/snippet}
  </BackupCard>
</section>

<style>
  .storage-actions,
  .storage-loading {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
  }
  .storage-loading {
    flex-direction: column;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8rem;
  }
</style>
