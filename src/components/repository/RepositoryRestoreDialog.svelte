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
      <AlertDialog.Title
        >{state.scope === "vault"
          ? "Restore vault checkpoint"
          : "Restore file version"}</AlertDialog.Title
      >
      <AlertDialog.Description>
        {#if state.recovery}
          An earlier restore was interrupted. Continue to check its original
          receipt. Newer edits will be retained. You can cancel to review
          another checkpoint.
        {:else if state.vault}
          Restore the vault to this checkpoint: {state.vault.added} files added,
          {state.vault.modified} changed and {state.vault.deleted} removed. A safety
          checkpoint saves all current files first. App runtime and excluded files
          are retained.
        {:else if state.preview}
          {state.preview.deleted ? "Remove" : "Restore"}
          {state.preview.path} to the selected version. A safety checkpoint saves
          your current files first. Any edits made since this preview must be reviewed
          again.
        {:else}Preparing the selected file version…{/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    {#if state.busy && !state.preview && !state.vault && !state.recovery}<div
        class="restore-skeleton"
        aria-label="Preparing restore"
      >
        <Skeleton style="height:1rem;width:80%" /><Skeleton
          style="height:1rem;width:60%"
        />
      </div>{/if}
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={state.busy}>Cancel</AlertDialog.Cancel>
      {#if state.recovery && controller.service.keepCurrent}<Button
          variant="outline"
          disabled={state.busy}
          onclick={() => controller.keepCurrent()}>Keep current files</Button
        >{/if}
      <Button
        disabled={(!state.preview && !state.vault && !state.recovery) ||
          state.busy}
        onclick={() => controller.apply()}
        >{state.busy
          ? "Restoring…"
          : state.scope === "vault"
            ? "Restore vault"
            : "Restore file"}</Button
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
