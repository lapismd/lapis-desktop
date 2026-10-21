<!-- Adapted from JJ Store StoreWorkField and its divided Settings rows. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  let {
    id,
    label,
    description,
    children,
  }: { id: string; label: string; description?: string; children: Snippet } =
    $props();
</script>

<Field.Field class="compute-setting-row">
  <div>
    <Field.Label for={id}>{label}</Field.Label
    >{#if description}<Field.Description>{description}</Field.Description>{/if}
  </div>
  <div class="control">{@render children()}</div>
</Field.Field>

<style>
  :global(.compute-setting-row) {
    display: grid;
    grid-template-columns: minmax(8rem, 1fr) minmax(0, 2fr);
    gap: 1rem;
    align-items: center;
    margin: 0;
    padding: 0.8rem 1rem;
    border-block-end: 1px solid var(--border);
  }
  :global(.compute-setting-row:last-child) {
    border-block-end: 0;
  }
  .control {
    min-width: 0;
    display: grid;
    gap: 0.5rem;
  }
  @container (max-width:30rem) {
    :global(.compute-setting-row) {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
    }
  }
</style>
