<script lang="ts">
  import { untrack } from "svelte";
  import { AppShell } from "@lapismd/design-core/workspace/app-shell";
  import {
    AppShellController,
    createDefaultWorkspaceLayout,
    createWorkspaceTab,
    createWorkspaceTabs,
    type WorkspaceWindow,
  } from "@lapismd/design-core/workspace/core";
  import { WorkspaceDragState } from "@lapismd/design-core/workspace/drag";
  import { WorkspacePopoutSurface } from "@lapismd/design-core/workspace/popout";

  let { id }: { id: string } = $props();
  const initialId = untrack(() => id);
  const layout = createDefaultWorkspaceLayout();
  const tab = createWorkspaceTab({
    id: `${initialId}-tab`,
    title: "Related window",
  });
  const workspaceWindow: WorkspaceWindow = {
    id: initialId,
    mode: "popout",
    state: "normal",
    bounds: { x: 120, y: 90, width: 720, height: 480 },
    root: createWorkspaceTabs([tab], { activeItemId: tab.id }),
  };
  layout.windows = [workspaceWindow];
  const controller = new AppShellController({ layout });
  const drag = new WorkspaceDragState(controller.renderer);
</script>

<AppShell.Root
  {controller}
  popoutHost={null}
  renderPopouts={false}
  renderOverlays={false}
  disposeOnDestroy={true}
  theme="inherit"
>
  <WorkspacePopoutSurface
    controller={controller.renderer}
    window={workspaceWindow}
    {drag}
  />
</AppShell.Root>
