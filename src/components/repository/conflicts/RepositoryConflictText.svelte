<script lang="ts">
  import { getContext, onDestroy, type ComponentProps } from "svelte";
  import { MergeEditor } from "@lapismd/design-core/diff";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import EllipsisVertical from "@lucide/svelte/icons/ellipsis-vertical";
  import {
    conflictMenuContext,
    type ConflictMenuState,
  } from "../../../lib/repository/conflict-menu.ts";
  let {
    path,
    headerActions: hostActions,
    ...props
  }: ComponentProps<typeof MergeEditor> = $props();
  let settings = $state({
    wrap: false,
    syncHorizontalScroll: true,
    ignoreWhitespace: false,
    ignoreCase: false,
  });
  const ignoreWhitespace = $derived(
    props.ignoreWhitespace ?? settings.ignoreWhitespace,
  );
  const ignoreCase = $derived(props.ignoreCase ?? settings.ignoreCase);
  const menuId = Symbol("merge-settings");
  const nestedMenu = getContext<ConflictMenuState | undefined>(
    conflictMenuContext,
  );
  function update(patch: Partial<typeof settings>) {
    settings = { ...settings, ...patch };
  }
  function menuOpen(next: boolean) {
    if (next) nestedMenu?.(menuId, true);
    else queueMicrotask(() => nestedMenu?.(menuId, false));
  }
  onDestroy(() => nestedMenu?.(menuId, false));
</script>

<MergeEditor
  {path}
  language={path?.endsWith(".md") ? "markdown" : null}
  baseLabel="Resolved"
  editableSides={["base"]}
  {...props}
  wrap={props.wrap ?? settings.wrap}
  syncHorizontalScroll={props.syncHorizontalScroll ??
    settings.syncHorizontalScroll}
  {ignoreWhitespace}
  {ignoreCase}
  onResolvedChange={(change) =>
    props.onResolvedChange?.({
      ...change,
      // Comparison filters cannot certify that a native conflict was resolved.
      resolved: change.resolved && !ignoreWhitespace && !ignoreCase,
    })}
>
  {#snippet headerActions()}
    {@render hostActions?.()}
    <DropdownMenu.Root onOpenChange={menuOpen}>
      <DropdownMenu.Trigger>
        {#snippet child({ props: triggerProps })}
          <Button
            {...triggerProps}
            variant="ghost"
            size="icon-xs"
            aria-label="Merge editor settings"
            title="Merge editor settings"
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" style="min-width: 14rem">
        <DropdownMenu.Group>
          <DropdownMenu.CheckboxItem
            checked={props.wrap ?? settings.wrap}
            onCheckedChange={(wrap) => update({ wrap })}
            closeOnSelect={false}>Wrap lines</DropdownMenu.CheckboxItem
          >
          <DropdownMenu.CheckboxItem
            checked={props.syncHorizontalScroll ??
              settings.syncHorizontalScroll}
            onCheckedChange={(syncHorizontalScroll) =>
              update({ syncHorizontalScroll })}
            closeOnSelect={false}
            >Sync horizontal scroll</DropdownMenu.CheckboxItem
          >
          <DropdownMenu.Separator />
          <DropdownMenu.CheckboxItem
            checked={ignoreWhitespace}
            onCheckedChange={(ignoreWhitespace) => update({ ignoreWhitespace })}
            closeOnSelect={false}>Ignore whitespace</DropdownMenu.CheckboxItem
          >
          <DropdownMenu.CheckboxItem
            checked={ignoreCase}
            onCheckedChange={(ignoreCase) => update({ ignoreCase })}
            closeOnSelect={false}>Ignore case</DropdownMenu.CheckboxItem
          >
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/snippet}
</MergeEditor>
