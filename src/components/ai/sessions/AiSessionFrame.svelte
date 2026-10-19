<!-- SPDX-License-Identifier: Apache-2.0; shared Notes inbox/file-preview composition. -->
<script lang="ts">
  import { onDestroy, type Snippet } from "svelte";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import "./session-shell.css";
  let {
    label,
    contentLabel = label,
    navigation,
    children,
    toolInspector,
    contentHidden = false,
    body = $bindable<HTMLElement | null>(null),
    height = $bindable(0),
    width = $bindable(0),
  }: {
    label: string;
    contentLabel?: string;
    navigation?: Snippet;
    children: Snippet;
    toolInspector?: Snippet;
    contentHidden?: boolean;
    body?: HTMLElement | null;
    height?: number;
    width?: number;
  } = $props();
  const shell = new AppShellController();
  onDestroy(() => void shell.dispose());
  $effect(() => {
    const element = body;
    if (!element) return;
    const measure = () => {
      height = element.clientHeight;
      width = element.clientWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  });
</script>

<div class="ai-session-shell" data-compact={width > 0 && width < 640}>
  <AppShell.Root
    controller={shell}
    displayMode="desktop"
    desktopMinMainWidth={0}
  >
    <AppShell.Main>
      <AppShell.Body layout="regions" element="div" {label} bind:ref={body}>
        {@render navigation?.()}
        <AppShell.Body.Content label={contentLabel} hidden={contentHidden}>
          {@render children()}
        </AppShell.Body.Content>
      </AppShell.Body>
    </AppShell.Main>
    {@render toolInspector?.()}
  </AppShell.Root>
</div>
