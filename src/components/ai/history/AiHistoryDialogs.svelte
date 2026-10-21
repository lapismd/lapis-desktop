<script lang="ts">
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import UndoIcon from "@lucide/svelte/icons/undo-2";
  import type { AiFileHistory } from "../../../lib/ai/chat/file-history.svelte.ts";
  import type { AiHistoryInspection } from "../../../lib/ai/chat/history-inspection.svelte.ts";
  let {
    history,
    inspection,
  }: { history: AiFileHistory; inspection: AiHistoryInspection } = $props();
</script>

<AlertDialog.Root
  open={!!history.pending}
  onOpenChange={(open) => {
    if (!open) history.cancelPending();
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>History checkpoint unavailable</AlertDialog.Title>
      <AlertDialog.Description
        >Your prompt is retained. Retry saving the starting checkpoint, or
        explicitly continue this turn without a saved comparison or undo
        protection.</AlertDialog.Description
      >
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => history.cancelPending()}
        >Cancel</AlertDialog.Cancel
      >
      <Button
        variant="outline"
        onclick={() => history.pending?.choose("continue")}
        >Continue without history</Button
      >
      <Button onclick={() => history.pending?.choose("retry")}
        ><RefreshIcon data-icon="inline-start" />Retry checkpoint</Button
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
<AlertDialog.Root
  open={!!inspection.undo}
  onOpenChange={(open) => {
    if (!open && !inspection.undoBusy) inspection.undo = undefined;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title
        >{inspection.recoveringUndo
          ? "Finish earlier undo"
          : "Undo observed file changes"}</AlertDialog.Title
      >
      <AlertDialog.Description>
        Restore {inspection.undo?.paths.length ?? 0} files to their saved state before
        this turn. This includes any human or external edits captured during the
        same turn. A safety checkpoint preserves current saved files first. Later
        edits prevent replacement.
        {#if inspection.recoveringUndo}The original request will be checked
          before continuing interrupted work.{/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel disabled={inspection.undoBusy}
        >Cancel</AlertDialog.Cancel
      >
      <Button
        disabled={inspection.undoBusy}
        onclick={() => void inspection.applyUndo()}
        ><UndoIcon data-icon="inline-start" />{inspection.undoBusy
          ? "Undoing…"
          : inspection.recoveringUndo
            ? "Continue undo"
            : "Undo changes"}</Button
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
