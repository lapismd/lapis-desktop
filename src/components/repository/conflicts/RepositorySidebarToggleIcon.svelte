<script lang="ts">
  let {
    side = "left",
    expanded = true,
  }: {
    side?: "left" | "right";
    expanded?: boolean;
  } = $props();
</script>

<svg
  class="community-sidebar-toggle-icon"
  data-ui-part="sidebar-toggle-icon"
  data-side={side}
  data-expanded={expanded}
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <rect x="1" y="2" width="22" height="20" rx="4"></rect>
  <g transform={side === "right" ? "translate(24 0) scale(-1 1)" : undefined}>
    <rect
      class="community-sidebar-toggle-icon__indicator"
      x="4"
      y="5"
      width={expanded ? 6 : 2}
      height="14"
      rx="2"
      fill="currentColor"
      data-ui-part="sidebar-toggle-indicator"
    ></rect>
  </g>
</svg>

<style>
  .community-sidebar-toggle-icon__indicator {
    width: 2px;
    transition: width 140ms ease;
  }

  .community-sidebar-toggle-icon[data-expanded="true"]
    .community-sidebar-toggle-icon__indicator {
    width: 6px;
  }
</style>
