<script lang="ts">
  import { DesktopWorkspaceStartup } from "@lapis-notes/workspace";
  import { startupTasks } from "../../../src/lib/notes/notes-startup.ts";
  let { restoring = false }: { restoring?: boolean } = $props();
  const tasks = startupTasks().map((task) => ({
    ...task,
    status: (task.id === "plugins"
      ? "active"
      : ["vault", "configuration"].includes(task.id)
        ? "complete"
        : "pending") as "active" | "complete" | "pending",
    ...(task.id === "plugins" ? { detail: "Loading Markdown" } : {}),
  }));
</script>

<div class="startup-review">
  <DesktopWorkspaceStartup
    tasks={restoring
      ? [
          { id: "restore", label: "Restore your notes", status: "complete" },
          { id: "storage", label: "Open notes storage", status: "active" },
        ]
      : tasks}
  />
</div>

<style>
  .startup-review {
    height: 100vh;
    width: 100%;
    min-width: 0;
  }
</style>
