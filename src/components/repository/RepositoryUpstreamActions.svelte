<script lang="ts">
  import { onMount } from "svelte";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CircleArrowDown from "@lucide/svelte/icons/circle-arrow-down";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import type { SyncController } from "../../lib/repository/sync-controller.ts";
  import type { SyncState } from "../../lib/repository/sync.ts";
  let {
    controller,
    unavailable = false,
  }: { controller?: SyncController; unavailable?: boolean } = $props();
  let state: SyncState = $state({
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  });
  onMount(() => {
    const stop = controller?.subscribe((next) => (state = next));
    void controller?.run("status");
    return stop;
  });
  const actions = [
    { action: "fetch", label: "Fetch from upstream", Icon: CircleArrowDown },
    { action: "pull", label: "Pull from upstream", Icon: ArrowDown },
    { action: "push", label: "Push to upstream", Icon: ArrowUp },
  ] as const;
  const counts = $derived(state.upstream?.divergence);
</script>

<div
  class="upstream-actions"
  role="group"
  aria-label="Upstream actions"
  aria-busy={state.busy}
>
  <Tooltip.Provider>
    {#each actions as action (action.action)}
      {@const blocked =
        unavailable ||
        !controller ||
        state.busy ||
        !state.upstream?.configuration ||
        (action.action !== "fetch" &&
          (state.recovery || Boolean(state.proposal?.conflicts.length))) ||
        (action.action === "push" && !state.upstream?.configuration?.canPush)}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <span {...blocked ? props : {}} class="action-trigger">
              <Button
                {...!blocked ? props : {}}
                variant="ghost"
                size="sm"
                class="upstream-action"
                disabled={blocked}
                onclick={(event) => {
                  if (typeof props.onclick === "function") props.onclick(event);
                  void controller?.run(action.action);
                }}
              >
                <action.Icon data-icon="inline-start" aria-hidden="true" />
                <span class="sr-label">{action.label}</span>
                {#if action.action !== "fetch"}<span class="count"
                    >{counts?.[
                      action.action === "pull" ? "incoming" : "outgoing"
                    ] ?? "—"}</span
                  >{/if}
              </Button>
            </span>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content role="tooltip">
          <strong>{action.label}</strong>
          {#if action.action !== "fetch"}<span class="count-description"
              >{counts
                ? `${counts[action.action === "pull" ? "incoming" : "outgoing"]} ${action.action === "pull" ? "incoming" : "outgoing"} commits since the last fetch`
                : "Commit count unavailable until upstream history is fetched"}</span
            >{/if}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </Tooltip.Provider>
</div>

<style>
  .upstream-actions {
    display: flex;
    align-items: center;
    margin-inline-start: auto;
    gap: 0.125rem;
    flex: none;
  }
  .action-trigger {
    display: inline-flex;
  }
  .sr-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .upstream-actions :global(.upstream-action) {
    height: 1.75rem;
    padding: 0 0.35rem;
    gap: 0.3rem;
  }
  .upstream-actions :global(.upstream-action svg) {
    width: 1rem;
    height: 1rem;
  }
  .count {
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
  }
  .count-description {
    display: block;
    font-size: 0.75rem;
  }
</style>
