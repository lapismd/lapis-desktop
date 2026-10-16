<script lang="ts">
  import VaultLauncher from "./VaultLauncher.svelte";
</script>

<header class="shell-header" data-tauri-drag-region>
  <span data-tauri-drag-region>Lapis Notes</span>
</header>
<main class="shell-content" aria-labelledby="welcome-title">
  <div class="shell-welcome">
    <img src="/lapis-logo.svg" width="80" height="80" alt="" />
    <h1 id="welcome-title">A new home for your notes</h1>
    <p>Choose a folder for your notes.</p>
    <VaultLauncher />
  </div>
</main>
