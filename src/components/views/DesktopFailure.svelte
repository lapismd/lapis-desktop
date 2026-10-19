<script lang="ts">
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";

  let { message }: { message: string } = $props();
</script>

<div class="desktop-failure">
  <Alert.Root variant="destructive">
    <CircleAlert aria-hidden="true" />
    <Alert.Description>{message}</Alert.Description>
  </Alert.Root>
</div>

<style>
  .desktop-failure {
    flex: none;
    margin: 0.75rem 1rem;
  }
</style>
