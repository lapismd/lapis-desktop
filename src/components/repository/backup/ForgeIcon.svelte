<script lang="ts">
  // Adapted from jj-store StoreForgeIcon.svelte (Apache-2.0).
  import { forgeIcons } from "./forge-icons.ts";
  let {
    provider,
    decorative = false,
  }: { provider: "github" | "forgejo"; decorative?: boolean } = $props();
  const icon = $derived(forgeIcons[provider]);
</script>

<svg
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : icon.name}
  aria-hidden={decorative || undefined}
  viewBox="0 0 24 24"
  width="16"
  height="16"
  fill="currentColor"
>
  <title>{icon.name}</title><path d={icon.path} />
</svg>
