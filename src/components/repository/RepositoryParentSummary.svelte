<script lang="ts">
  import RepositoryAuthorAvatar from "./RepositoryAuthorAvatar.svelte";
  let {
    target,
    author,
    email,
    handle,
    description,
  }: {
    target?: string;
    author?: string;
    email?: string;
    handle?: string;
    description?: string;
  } = $props();
</script>

<span class="repository-review-parent-summary">
  <span class="repository-review-parent-avatar">
    <RepositoryAuthorAvatar
      name={author ?? "Unknown author"}
      {email}
      {handle}
    />
  </span>
  <span class="repository-review-parent-message" title={description}>
    {description?.split("\n")[0] ||
      (target ? "Parent details unavailable" : "Choose a parent")}
  </span>
</span>

<style>
  .repository-review-parent-summary {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    align-items: center;
    gap: 0.5rem;
    text-align: start;
  }
  .repository-review-parent-avatar {
    display: inline-flex;
    flex: none;
  }
  .repository-review-parent-message {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
