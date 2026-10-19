<!-- Adapted from jj-store StoreSettingsFooter.svelte. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Card from "@lapismd/design-core/shadcn/card";
  let { description, children }: { description?: Snippet; children: Snippet } =
    $props();
</script>

<Card.Footer class="store-settings-footer">
  {#if description}<div class="store-settings-footer__description">
      {@render description()}
    </div>{/if}
  <div class="store-settings__actions">{@render children()}</div>
</Card.Footer>
