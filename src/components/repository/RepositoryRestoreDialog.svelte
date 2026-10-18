<script lang="ts">
  import { onMount } from "svelte";
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import type {
    RestoreController,
    RestoreState,
  } from "../../lib/repository/restore.ts";
  let { controller }: { controller: RestoreController } = $props();
  let state = $state<RestoreState>({ open: false, busy: false });
  onMount(() => controller.subscribe((value) => (state = value)));
</script>

<AlertDialog.Root
  open={state.open}
  onOpenChange={(open) => {
    if (!open) controller.dismiss();
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Restore file version</AlertDialog.Title>
      <AlertDialog.Description>
        {#if state.preview}
          {state.preview.deleted ? "Remove" : "Restore"}
          {state.preview.path} to the selected version. A safety checkpoint saves
          your current files first. Any edits made since this preview must be reviewed
          again.
        {:else}Preparing the selected file version…{/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    {#if state.busy && !state.preview}<div
        class="restore-skeleton"
        aria-label="Preparing restore"
      >
        <Skeleton style="height:1rem;width:80%" /><Skeleton
          style="height:1rem;width:60%"
        />
      </div>{/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={state.busy}>Cancel</AlertDialog.Cancel>
      <Button
        disabled={!state.preview || state.busy}
        onclick={() => controller.apply()}
        >{state.busy ? "Restoring…" : "Restore file"}</Button
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  .restore-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
