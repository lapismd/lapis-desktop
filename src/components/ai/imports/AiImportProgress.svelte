<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Progress } from "@lapismd/design-core/shadcn/progress";
  import RefreshIcon from "@lucide/svelte/icons/refresh-cw";
  import AlertIcon from "@lucide/svelte/icons/triangle-alert";
  import type { ImportState } from "../../../lib/ai/imports/state.svelte.ts";
  import type { BrowserSession } from "../../../lib/ai/imports/source-port.ts";
  let {
    imports,
    selected,
  }: { imports: ImportState; selected: BrowserSession } = $props();
</script>

{#if imports.phase === "reading"}<section
    class="preview-progress"
    aria-label="Transcript loading"
  >
    <div>
      <span>{imports.entries.length} entries available</span><small
        >{imports.paused
          ? "Paused"
          : selected.bytes
            ? `Reading ${(selected.bytes / 1024 / 1024).toFixed(1)} MiB of local history`
            : "Reading local history"}</small
      >
    </div>
    <Progress
      value={imports.progress}
      aria-label="Transcript loading progress"
    />
  </section>
{:else if imports.phase === "failed"}<div class="source-status">
    <AlertIcon aria-hidden="true" /><span
      >Preview incomplete. Reload to read the current source.</span
    ><Button variant="ghost" size="sm" onclick={() => void imports.reload()}
      ><RefreshIcon data-icon="inline-start" aria-hidden="true" />Reload preview</Button
    >
  </div>
{:else if imports.cachedPreview}<div class="source-status">
    <Badge variant="secondary">Cached preview</Badge><span
      >Available from the last verified snapshot.</span
    >
  </div>{/if}

<style>
  .preview-progress {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0 0.75rem 0.5rem;
    padding: 0.625rem 0.75rem;
    background: var(--muted);
    border-radius: 0.5rem;
  }
  .preview-progress > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.375rem;
    font-size: 0.75rem;
  }
  small {
    font-size: 0.6875rem;
    color: var(--muted-foreground);
  }
  .source-status {
    display: flex;
    flex: none;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .source-status > :global(svg) {
    width: 1rem;
    height: 1rem;
    flex: none;
  }
</style>
