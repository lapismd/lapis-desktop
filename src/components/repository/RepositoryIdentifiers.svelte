<script lang="ts">
  import { onDestroy } from "svelte";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import {
    abbreviateRevisionId,
    revisionLeadingChars,
  } from "../../lib/repository/graph/revision-id.ts";
  import "./repository-identifiers.css";

  let {
    copyText,
    changeId = "",
    commitId = "",
    commitLabel = "commit ID",
    compactLeadingChars = 4,
    expandedLeadingChars = 5,
    placement = "overlay",
  }: {
    copyText(value: string): Promise<void>;
    changeId?: string | undefined;
    commitId?: string | undefined;
    commitLabel?: string | undefined;
    /** Leading characters shown at rest, without dots or suffix. */
    compactLeadingChars?: number;
    /** Leading characters shown by the hovered or keyboard-focused half. */
    expandedLeadingChars?: number;
    placement?: "overlay" | "inline" | undefined;
  } = $props();

  type Side = "commit" | "change";
  type Feedback = "" | "copied" | "failed";
  let feedback = $state<Record<Side, Feedback>>({ commit: "", change: "" });
  const timers: Partial<Record<Side, ReturnType<typeof setTimeout>>> = {};
  const requests = { commit: 0, change: 0 };
  let destroyed = false;
  const compact = $derived(revisionLeadingChars(compactLeadingChars, 4));
  const expanded = $derived(
    Math.max(compact, revisionLeadingChars(expandedLeadingChars, 5)),
  );
  let hovered = $state<Side | null>(null);
  let focused = $state<Side | null>(null);
  let feedbackSide = $state<Side>("commit");
  const active = $derived(
    focused ?? hovered ?? (feedback[feedbackSide] ? feedbackSide : null),
  );

  function reset() {
    for (const side of ["commit", "change"] as const) {
      clearTimeout(timers[side]);
      requests[side]++;
      feedback[side] = "";
    }
  }
  $effect(() => {
    // Reused file/snapshot surfaces must not show feedback for the previous ID.
    void commitId;
    void changeId;
    reset();
  });
  onDestroy(() => {
    destroyed = true;
    reset();
  });

  async function copy(side: Side, value: string): Promise<void> {
    const request = ++requests[side];
    clearTimeout(timers[side]);
    feedback[side] = "";
    let result: Feedback;
    try {
      await copyText(value);
      result = "copied";
    } catch {
      result = "failed";
    }
    if (destroyed || requests[side] !== request) return;
    feedback[side] = result;
    feedbackSide = side;
    timers[side] = setTimeout(() => {
      feedback[side] = "";
    }, 1_500);
  }
</script>

{#snippet splitButton(label: string, value: string, side: Side, chip: string)}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="repository-identifiers__split-button"
          data-side={side}
          data-active={active === side || undefined}
          onpointerenter={(event) => {
            if (
              event.pointerType !== "touch" &&
              matchMedia("(hover: hover)").matches
            )
              hovered = side;
          }}
          onpointerleave={() => {
            hovered = null;
          }}
          onfocus={(event) => {
            focused = event.currentTarget.matches(":focus-visible")
              ? side
              : null;
          }}
          onblur={() => {
            focused = null;
          }}
          aria-label={`${chip} ${feedback[side] ? (feedback[side] === "copied" ? "Copied" : "Retry") : active === side ? abbreviateRevisionId(value, expanded) : value.slice(0, compact)} · Copy ${label} ${value}`}
          data-copied={feedback[side] === "copied" || undefined}
          data-copy-failed={feedback[side] === "failed" || undefined}
          onclick={(event) => {
            event.stopPropagation();
            void copy(side, value);
          }}
        >
          <span class="repository-id-chip" aria-hidden="true">{chip}</span>
          {#if feedback[side] && active === side}
            <span
              class="id-feedback"
              data-copy-feedback={feedback[side]}
              aria-hidden="true"
            >
              {#if feedback[side] === "copied"}<Check />{:else}<TriangleAlert
                />{/if}
              {feedback[side] === "copied" ? "Copied" : "Retry"}
            </span>
          {:else}
            <code class="id-compact">{value.slice(0, compact)}</code>
            <code class="id-expanded"
              >{abbreviateRevisionId(value, expanded)}</code
            >
          {/if}
        </button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="top" sideOffset={6}>{value}</Tooltip.Content>
  </Tooltip.Root>
{/snippet}

{#if commitId || changeId}
  <div class="repository-identifiers" data-placement={placement}>
    {#if commitLabel === "commit ID"}
      <div
        class="repository-identifiers__split"
        data-active={active ?? undefined}
        data-single={!commitId || !changeId || undefined}
        style:--id-compact={compact}
        style:--id-expanded={expanded + 4}
        role="group"
        aria-label="Native revision identifiers"
      >
        <Tooltip.Provider delayDuration={0}>
          {#if commitId}{@render splitButton(
              "Git commit SHA",
              commitId,
              "commit",
              "GIT",
            )}{/if}
          {#if changeId}{@render splitButton(
              "JJ Change ID",
              changeId,
              "change",
              "JJ",
            )}{/if}
        </Tooltip.Provider>
      </div>
    {:else if commitId}
      <button
        type="button"
        class="repository-identifiers__button"
        aria-label={`${commitId.length <= 13 ? commitId : `${commitId.slice(0, 8)}…${commitId.slice(-4)}`} · Copy full ${commitLabel}: ${commitId}`}
        title="Copy full {commitLabel}"
        data-copied={feedback.commit === "copied" || undefined}
        data-copy-failed={feedback.commit === "failed" || undefined}
        onclick={(event) => {
          event.stopPropagation();
          void copy("commit", commitId);
        }}
      >
        <code
          >{commitId.length <= 13
            ? commitId
            : `${commitId.slice(0, 8)}…${commitId.slice(-4)}`}</code
        >
        {#if feedback.commit === "copied"}<Check aria-hidden="true" />
        {:else if feedback.commit === "failed"}<TriangleAlert
            aria-hidden="true"
          />
        {:else}<Copy aria-hidden="true" />{/if}
      </button>
    {/if}
    {#if commitLabel === "commit ID"}
      <span
        class="clipboard-status"
        role="status"
        aria-label="Clipboard feedback"
        aria-atomic="true"
      >
        {#each ["commit", "change"] as const as side}
          {#if feedback[side]}
            {feedback[side] === "copied" ? "Copied" : "Could not copy"}
            {side === "change"
              ? "JJ Change ID"
              : commitLabel === "commit ID"
                ? "Git commit SHA"
                : commitLabel}.
          {/if}
        {/each}
      </span>
    {/if}
  </div>
{/if}
