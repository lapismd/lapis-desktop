<script lang="ts">
  let { path }: { path: string } = $props();
  const split = $derived(path.lastIndexOf("/") + 1);
</script>

<span class="path"
  ><span class="directory">{path.slice(0, split)}</span><span class="filename"
    >{path.slice(split)}</span
  ></span
>

<style>
  .path {
    display: flex;
    min-width: 0;
  }
  .directory {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .filename {
    flex: 0 1 auto;
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
