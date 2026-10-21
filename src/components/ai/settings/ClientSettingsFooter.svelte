<!-- Adapted from jj-store StoreSettingsFooter.svelte. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    description,
    children,
    footer = false,
    wrapActions = false,
  }: {
    description?: Snippet;
    children: Snippet;
    footer?: boolean;
    wrapActions?: boolean;
  } = $props();
</script>

<div class="store-settings-footer" class:store-settings-footer--footer={footer}>
  {#if description}<div class="store-settings-footer__description">
      {@render description()}
    </div>{/if}
  <div
    class="store-settings__actions"
    style:flex={wrapActions ? "0 1 auto" : undefined}
    style:flex-wrap={wrapActions ? "wrap" : undefined}
    style:min-width={wrapActions ? "0" : undefined}
  >
    {@render children()}
  </div>
</div>
