<!-- Adapted from jj-store StoreSettingsFooter.svelte. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    description,
    children,
    footer = false,
  }: {
    description?: Snippet;
    children: Snippet;
    footer?: boolean;
  } = $props();
</script>

<div class="store-settings-footer" class:store-settings-footer--footer={footer}>
  {#if description}<div class="store-settings-footer__description">
      {@render description()}
    </div>{/if}
  <div class="store-settings__actions">{@render children()}</div>
</div>
