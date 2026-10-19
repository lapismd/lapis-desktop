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

<Field.Field>
  <Field.Label for={id}>{label}</Field.Label>
  {#if description}<Field.Description>{description}</Field.Description>{/if}
  {@render children()}
</Field.Field>
