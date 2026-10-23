<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { MediaQuery } from "svelte/reactivity";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import RepositoryConflictSurface from "../conflicts/RepositoryConflictSurface.svelte";
  import RepositoryConflictText from "../conflicts/RepositoryConflictText.svelte";
  import { RepositorySkeleton } from "@lapismd/repository-ui/jj";
  import type { SyncController } from "../../../lib/repository/sync-controller.ts";
  import type { SyncState } from "../../../lib/repository/sync.ts";
  let {
    controller,
    open,
    onClose,
  }: { controller: SyncController; open: boolean; onClose(): void } = $props();
  let snapshot = $state<SyncState>({
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  });
  let active = $state("");
  let browserOpen = $state(true);
  let draft = $state("");
  let seed = $state("");
  let resolved = $state(false);
  let loaded = "";
  let requested = $state("");
  const compact = new MediaQuery("(max-width: 700px)");
  const files = $derived(
    snapshot.proposal?.conflicts.map((path) => ({ path })) ?? [],
  );
  const detail = $derived(
    snapshot.conflict?.path === active ? snapshot.conflict : undefined,
  );
  const text = $derived(
    detail?.terms.length === 3 &&
      detail.terms.every(
        (term) =>
          term.kind === "text" &&
          term.executable === detail.terms[0].executable,
      ),
  );
  onMount(() => controller.subscribe((next) => (snapshot = next)));
  $effect(() => {
    if (!open || snapshot.busy || !files.length) return;
    const path = files.some((file) => file.path === active)
      ? active
      : files[0].path;
    if (active !== path) active = path;
    if (detail) {
      const key = `${snapshot.proposal?.candidate?.commit}:${path}`;
      if (loaded !== key) {
        loaded = key;
        draft = detail.terms[1]?.text ?? "";
        seed = draft;
        resolved = false;
      }
    } else {
      const key = `${snapshot.proposal?.candidate?.commit}:${path}`;
      if (requested !== key) {
        requested = key;
        untrack(() => void controller.inspect(path));
      }
    }
  });
  $effect(() => {
    if (compact.current) browserOpen = false;
  });
  $effect(() => {
    if (open && !snapshot.busy && !files.length) untrack(onClose);
  });
</script>

<RepositoryConflictSurface
  {open}
  label="Resolve backup synchronization conflicts"
  busy={snapshot.busy}
  locked={snapshot.busy}
  bind:browserOpen
  compact={compact.current}
  {files}
  activePath={active}
  onSelect={(path) => {
    active = path;
    if (compact.current) browserOpen = false;
  }}
  {onClose}
>
  {#snippet actions()}
    {#if detail}<Button
        size="sm"
        disabled={snapshot.busy || !text || !resolved}
        onclick={() =>
          controller.resolve(active, {
            kind: "text",
            text: draft,
            executable: detail?.terms[0].executable ?? false,
          })}>Save resolution</Button
      >
      <Button
        variant="outline"
        size="sm"
        disabled={snapshot.busy}
        onclick={() => controller.resolve(active, { kind: "delete" })}
        >Delete file</Button
      >{/if}
  {/snippet}
  {#if !detail}
    {#if snapshot.busy}<RepositorySkeleton
        kind="conflicts"
        label="Loading synchronization conflict"
      />
    {:else}<section class="unsupported">
        <p>Conflict details are unavailable.</p>
        <Button
          variant="outline"
          size="sm"
          onclick={() => controller.inspect(active)}
          >Retry conflict details</Button
        >
      </section>{/if}
  {:else if text}<RepositoryConflictText
      path={active}
      left={detail.terms[0].text ?? ""}
      base={seed}
      right={detail.terms[2].text ?? ""}
      editable
      onResolvedChange={({ content, resolved: complete }) => {
        draft = content;
        resolved = complete;
      }}
    />
  {:else}<section class="unsupported">
      <p>Choose a retained version for this file.</p>
      {#each detail.terms.filter((term) => term.role === "add") as term}<Button
          variant="outline"
          size="sm"
          disabled={snapshot.busy || term.kind === "unsupported"}
          onclick={() =>
            controller.resolve(active, { kind: "term", id: term.id })}
          >Use {term.id === 0 ? "local" : "remote"} version ({term.kind})</Button
        >{/each}
    </section>{/if}
</RepositoryConflictSurface>

<style>
  .unsupported {
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  p {
    flex-basis: 100%;
    font-size: 0.8rem;
  }
</style>
