<script lang="ts">
  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";

  let { error = null }: { error?: string | null } = $props();
  let detail = $state<string | undefined>();

  export function fail(failure: unknown): void {
    error = failure instanceof Error ? failure.message : String(failure);
    detail = failure instanceof Error ? failure.stack : undefined;
  }
</script>

<DesktopWorkspaceStartup
  tasks={[
    {
      id: "shell",
      label: "Load the desktop shell",
      status: error ? "failed" : "active",
    },
    { id: "restore", label: "Restore your notes", status: "pending" },
  ]}
  failure={error
    ? { title: "Could not start Lapis Notes", description: error, detail }
    : null}
/>
