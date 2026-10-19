<script lang="ts">
  // Uses the maintained restore-dialog composition for an explicit local decision.
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import type { PendingPublication } from "../../../lib/repository/remote.ts";
  let {
    pending,
    busy,
    canObserve,
    onObserve,
    onStop,
  }: {
    pending: PendingPublication;
    busy: boolean;
    canObserve: boolean;
    onObserve(id: string): Promise<boolean>;
    onStop(id: string): Promise<boolean>;
  } = $props();
  let confirm = $state(false);
  let selected = $state<PendingPublication>();
  const terminal = $derived(
    ["complete", "stale", "stopped"].includes(pending.outcome),
  );
  async function stop() {
    if (selected && (await onStop(selected.request_id))) confirm = false;
  }
</script>

<section class="publication-recovery" aria-label="Original backup push">
  <strong>Previous push needs review</strong>
  <p>
    {terminal
      ? "Its recorded result can be retained and the local recovery marker cleared."
      : "The result of this original push has not been confirmed. Checking it never sends the push again."}
  </p>
  <dl>
    <div>
      <dt>Checkpoint</dt>
      <dd><code title={pending.after}>{pending.after.slice(0, 12)}</code></dd>
    </div>
    <div>
      <dt>Request</dt>
      <dd><code>{pending.request_id}</code></dd>
    </div>
  </dl>
  <div class="publication-actions">
    <Button
      variant="outline"
      size="sm"
      disabled={busy || !canObserve}
      onclick={() => onObserve(pending.request_id)}>Check original push</Button
    >
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onclick={() => {
        if (terminal) void onStop(pending.request_id);
        else {
          selected = pending;
          confirm = true;
        }
      }}>{terminal ? "Finish recovery" : "Stop tracking this push"}</Button
    >
  </div>
  {#if !canObserve}<p>
      Reconnect the account to check the remote result. You can stop tracking
      this request locally.
    </p>{/if}
</section>
<AlertDialog.Root
  open={confirm}
  onOpenChange={(open) => {
    if (!busy) confirm = open;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header
      ><AlertDialog.Title>Stop tracking this push?</AlertDialog.Title
      ><AlertDialog.Description>
        Its outcome will remain unknown. This retains the original receipt and
        all local history, and cannot cancel or undo a push that reached the
        remote. The next synchronization must fetch and merge before publishing
        a new request.
      </AlertDialog.Description></AlertDialog.Header
    >
    <AlertDialog.Footer
      ><AlertDialog.Cancel disabled={busy}>Keep tracking</AlertDialog.Cancel
      ><Button disabled={busy} onclick={stop}>Stop tracking</Button
      ></AlertDialog.Footer
    >
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  .publication-recovery {
    border-top: 1px solid var(--border);
    margin-top: 1.25rem;
    padding-top: 1rem;
    font-size: 0.8rem;
  }
  p {
    color: var(--muted-foreground);
    margin: 0.5rem 0;
  }
  dl {
    margin: 0.75rem 0;
    display: grid;
    gap: 0.4rem;
  }
  dl div {
    display: flex;
    gap: 0.5rem;
    min-width: 0;
  }
  dt {
    color: var(--muted-foreground);
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .publication-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
