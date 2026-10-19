<script lang="ts">
  // Adapted from jj-store StoreWorkField.svelte (Apache-2.0).
  import * as Field from "@lapismd/design-core/shadcn/field";
  import type { Snippet } from "svelte";
  let {
    id,
    label,
    description,
    children,
  }: { id: string; label: string; description?: string; children: Snippet } =
    $props();
</script>

<Field.Field class="backup-field">
  <div class="backup-field-copy">
    <Field.Label for={id}>{label}</Field.Label>
    {#if description}<Field.Description>{description}</Field.Description>{/if}
  </div>
  <div class="backup-field-control">{@render children()}</div>
</Field.Field>

<style>
  :global(.backup-field) {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    gap: 1rem;
    align-items: start;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }
  .backup-field-copy {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }
  .backup-field-control {
    min-width: 0;
  }
  @media (max-width: 40rem) {
    :global(.backup-field) {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.65rem;
    }
  }
</style>
