<script lang="ts">
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import type { FileListingViewMode } from "@lapismd/design-core/diff";
  import { onDestroy, type Snippet } from "svelte";
  import RepositoryConflictFileTree from "./RepositoryConflictFileTree.svelte";

  let {
    height,
    files,
    activePath,
    browserOpen,
    compact,
    locked,
    onSelect,
    children,
  }: {
    height: number;
    files: readonly { path: string }[];
    activePath: string;
    browserOpen: boolean;
    compact: boolean;
    locked: boolean;
    onSelect: (path: string) => void;
    children: Snippet;
  } = $props();
  const shell = new AppShellController();
  onDestroy(() => void shell.dispose());
  let mode = $state<FileListingViewMode>("tree");
  let collapsed = $state(new Set<string>());
  function toggleDirectory(path: string) {
    const next = new Set(collapsed);
    if (!next.delete(path)) next.add(path);
    collapsed = next;
  }
</script>

<AppShell.Root
  controller={shell}
  displayMode="desktop"
  desktopMinMainWidth={0}
  class="store-conflict-editor__body-shell"
  style={`--ui-shell-height:${height}px`}
>
  <AppShell.Main>
    <AppShell.Body
      layout="regions"
      element="section"
      label="Conflict editor body"
    >
      <AppShell.Body.Sidebar
        id="conflict-file-browser"
        panelId="conflict-file-browser"
        side="left"
        label="Conflict file browser"
        open={browserOpen}
        scrollbarVisibility="hover"
        class="community-projects__file-tree-region"
        style={`--ui-shell-body-sidebar-width: ${compact ? "100%" : "15rem"}`}
      >
        <div
          class="store-conflict-editor__file-browser"
          inert={locked}
          aria-disabled={locked}
        >
          <RepositoryConflictFileTree
            {files}
            {mode}
            collapsedDirectoryPaths={collapsed}
            selectedPath={activePath}
            onSelectPath={(path) => {
              if (!locked) onSelect(path);
            }}
            onModeChange={(next) => (mode = next)}
            onDirectoryToggle={toggleDirectory}
          />
        </div>
      </AppShell.Body.Sidebar>
      <AppShell.Body.Content
        label="Conflict merge content"
        scrollbarVisibility="hover"
        class="store-conflict-editor__content"
        hidden={compact && browserOpen}
      >
        <div
          class="store-conflict-editor__content-body"
          style={`height:${height}px`}
        >
          {@render children()}
        </div>
      </AppShell.Body.Content>
    </AppShell.Body>
  </AppShell.Main>
</AppShell.Root>
