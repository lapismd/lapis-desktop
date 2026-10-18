<script lang="ts">
  import { setContext, type Snippet } from "svelte";
  import {
    conflictMenuContext,
    type ConflictMenuState,
  } from "../../../lib/repository/conflict-menu.ts";
  import { AppShell } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import XIcon from "@lucide/svelte/icons/x";
  import RepositorySidebarToggleIcon from "./RepositorySidebarToggleIcon.svelte";
  import RepositoryConflictBody from "./RepositoryConflictBody.svelte";
  import "./repository-conflicts.css";
  let bodyHeight = $state(0);
  function measure(node: HTMLDivElement) {
    const observer = new ResizeObserver(() => {
      bodyHeight = node.clientHeight;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
  let {
    open,
    label,
    returnFocus,
    busy,
    dismissOnEscape = true,
    locked,
    browserOpen = $bindable(true),
    compact,
    files,
    activePath,
    onSelect,
    onClose,
    actions,
    children,
  }: {
    open: boolean;
    label: string;
    returnFocus?: HTMLElement | null;
    busy: boolean;
    dismissOnEscape?: boolean;
    locked: boolean;
    browserOpen?: boolean;
    compact: boolean;
    files: readonly { path: string }[];
    activePath: string;
    onSelect: (path: string) => void;
    onClose: () => void;
    actions: Snippet;
    children: Snippet;
  } = $props();
  const menus = new Set<symbol>();
  let menuCount = $state(0);
  setContext<ConflictMenuState>(conflictMenuContext, (id, next) => {
    if (next) menus.add(id);
    else menus.delete(id);
    menuCount = menus.size;
  });
</script>

<AppShell.SurfaceLayer
  {open}
  {returnFocus}
  {label}
  coverPanelIds={["right"]}
  mobilePlacement="root"
  dismissOnEscape={!busy && dismissOnEscape && menuCount === 0}
  onDismiss={onClose}
  class="store-conflict-editor"
>
  <AppShell.SurfaceLayer.Header class="store-conflict-editor__header">
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`${browserOpen ? "Hide" : "Show"} conflict file browser`}
      title={`${browserOpen ? "Hide" : "Show"} conflict file browser`}
      aria-expanded={browserOpen}
      aria-controls="conflict-file-browser"
      onclick={() => (browserOpen = !browserOpen)}
      ><RepositorySidebarToggleIcon expanded={browserOpen} /></Button
    >
    <h1 class="store-conflict-editor__title">Resolve conflicts</h1>
    {@render actions()}
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Close conflict editor"
      disabled={busy}
      onclick={onClose}><XIcon aria-hidden="true" /></Button
    >
  </AppShell.SurfaceLayer.Header>
  <div class="store-conflict-editor__body" use:measure>
    <RepositoryConflictBody
      {files}
      height={bodyHeight}
      {activePath}
      {browserOpen}
      {compact}
      {locked}
      {onSelect}>{@render children()}</RepositoryConflictBody
    >
  </div>
</AppShell.SurfaceLayer>
