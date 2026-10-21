<script lang="ts">
  import {
    matchesEditorAssociationGlob,
    type App,
    type WorkspaceCustomSettingProps,
  } from "@lapis-notes/api";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import { memoryFolder } from "../../../lib/ai/memory/note-paths.ts";
  let {
    id,
    field,
    value,
    disabled,
    busy,
    setValue,
  }: WorkspaceCustomSettingProps = $props();
  const app = $derived((field as typeof field & { app: App }).app);
  let draft = $state("");
  let open = $state(false);
  let paths = $state<string[]>([]);
  let invalid = $state("");
  let exclusions = $state<readonly string[]>([]);
  $effect(() => {
    const refresh = () => {
      const saved = app.configuration.getConfiguration().get("files.exclude");
      exclusions = Array.isArray(saved) ? saved : [".git", ".jj"];
    };
    refresh();
    const ref = app.configuration.on("updated", refresh);
    return () => app.configuration.offref(ref);
  });
  const excluded = $derived(
    draft
      .split("/")
      .some((_, index, parts) =>
        exclusions.some((pattern) =>
          matchesEditorAssociationGlob(
            pattern,
            parts.slice(0, index + 1).join("/"),
            { caseSensitive: true },
          ),
        ),
      ),
  );
  $effect(() => {
    draft = String(value ?? "Memory");
  });
  async function save(path: string) {
    try {
      memoryFolder(path);
      invalid = "";
    } catch (error) {
      invalid = (error as Error).message;
      return;
    }
    if (await setValue(path)) {
      open = false;
      draft = path;
    }
  }
</script>

<div class="memory-folder-field">
  <div class="memory-folder-controls">
    <Input
      {id}
      aria-label="Memory folder"
      bind:value={draft}
      disabled={disabled || busy}
      aria-invalid={Boolean(invalid)}
      onkeydown={(event) => {
        if (event.key === "Enter") void save(draft);
      }}
    />
    <Popover.Root bind:open>
      <Popover.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            size="icon"
            aria-label="Choose memory folder"
            disabled={disabled || busy}
            onclick={() => {
              paths = app.vault
                .getAllFolders()
                .map((folder) => folder.path)
                .filter(
                  (path) =>
                    path &&
                    !path.split("/").some((part) => part.startsWith(".")),
                );
            }}><FolderIcon aria-hidden="true" /></Button
          >
        {/snippet}
      </Popover.Trigger>
      <Popover.Content align="end" style="--ui-popover-padding: 0">
        <CommandView.Root>
          <CommandView.Input placeholder="Choose a new memory location" />
          <CommandView.List>
            <CommandView.Item
              value="Memory"
              onSelect={() => {
                draft = "Memory";
                open = false;
              }}>Memory</CommandView.Item
            >
            {#each paths.filter((path) => path !== "Memory") as path (path)}
              <CommandView.Item
                value={path}
                onSelect={() => {
                  draft = `${path}/Memory`;
                  open = false;
                }}>{path}/Memory</CommandView.Item
              >
            {/each}
          </CommandView.List>
        </CommandView.Root>
      </Popover.Content>
    </Popover.Root>
    <Button
      variant="outline"
      disabled={disabled || busy || draft === value}
      onclick={() => void save(draft)}>Apply</Button
    >
  </div>
  {#if invalid}<p class="memory-folder-hint">{invalid}</p>{/if}
  {#if excluded}<p class="memory-folder-hint" role="status">
      This folder is excluded by Workspace file exclusions and will not be
      indexed.
    </p>{/if}
  <p class="memory-folder-hint">
    Memory uses normal vault indexing. Workspace file exclusions also apply to
    this folder.
  </p>
</div>

<style>
  .memory-folder-field {
    min-width: 0;
  }
  .memory-folder-controls {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .memory-folder-controls :global(input) {
    min-width: 0;
    flex: 1;
  }
  .memory-folder-hint {
    margin: 0.375rem 0 0;
    color: var(--ui-muted-foreground);
    font-size: 0.75rem;
  }
</style>
