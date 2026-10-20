<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { isLapisInternalPath } from "@lapis-notes/api/path";
  import { FileEmbed } from "@lapis-notes/markdown/embed";
  import { parseMiraFileTarget } from "@lapismd/mira/extensions";
  import * as HoverCard from "@lapismd/design-core/shadcn/hover-card";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import FileTextIcon from "@lucide/svelte/icons/file-text";

  let {
    app,
    path,
    sourcePath = "",
    label,
  }: {
    app: App;
    path: string;
    sourcePath?: string;
    label: string;
  } = $props();
  const target = $derived(
    parseMiraFileTarget(path, sourcePath, { decodeUri: true }),
  );
  const file = $derived(
    target.path &&
      !/^(?:[a-z][a-z\d+.-]*:|[\\/])/iu.test(target.path) &&
      !/[\r\n\0]/u.test(target.path) &&
      !isLapisInternalPath(target.path)
      ? app.metadataCache.getFirstLinkpathDest(target.path, sourcePath)
      : null,
  );
  function open(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (file)
      void app.openFile(file).catch((error) => {
        app.notifications.notify({
          id: "ai-note-navigation-error",
          source: "ai",
          severity: "error",
          title: "Open note",
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }
</script>

{#snippet reference()}
  <FileTextIcon aria-hidden="true" /><span>{label}</span>
{/snippet}
{#if file && !isLapisInternalPath(file.path)}
  <HoverCard.Root>
    <HoverCard.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          class="file-reference"
          type="button"
          aria-label={`Preview ${label}`}
          onmousedown={(event) => event.preventDefault()}
          onclick={open}
        >
          {@render reference()}
        </button>
      {/snippet}
    </HoverCard.Trigger>
    <HoverCard.Content
      style="width: min(26rem, calc(100vw - 2rem)); max-height: calc(100vh - 2rem); padding: 0.75rem;"
    >
      <ScrollArea.Root
        style="height: min(18rem, calc(100vh - 4rem)); width: 100%;"
      >
        <FileEmbed {app} {file} {sourcePath} onopen={open} />
      </ScrollArea.Root>
    </HoverCard.Content>
  </HoverCard.Root>
{:else}
  <span class="file-reference" title={path}>{@render reference()}</span>
{/if}

<style>
  .file-reference {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    min-width: 0;
    padding-inline: 0.3em;
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
    color: inherit;
    text-decoration: none;
  }
  .file-reference > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-reference > :global(svg) {
    width: 0.9em;
    height: 0.9em;
    flex: none;
  }
</style>
