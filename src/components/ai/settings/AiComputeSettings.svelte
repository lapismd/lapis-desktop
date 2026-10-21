<!-- Adapted from JJ Store StoreComputeSettings/StoreComputeModels; Apache-2.0. -->
<script lang="ts">
  import "./agent-clients.css";
  import "./settings-tabs.css";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import ComputeSettingRow from "./ComputeSettingRow.svelte";
  import AiComputeSharing from "./AiComputeSharing.svelte";
  import AiComputeModels from "./AiComputeModels.svelte";
  import { ResponsiveTabs } from "@lapismd/design-core/shadcn/responsive-tabs";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import {
    QuantityInput,
    countUnits,
  } from "@lapismd/design-core/forms/quantity-input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import CpuIcon from "@lucide/svelte/icons/cpu";
  import CheckIcon from "@lucide/svelte/icons/check";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import SquareIcon from "@lucide/svelte/icons/square";
  import SaveIcon from "@lucide/svelte/icons/save";
  import BoxesIcon from "@lucide/svelte/icons/boxes";
  import NetworkIcon from "@lucide/svelte/icons/network";
  import type {
    AiCompute,
    ComputeAction,
  } from "../../../lib/ai/settings/compute.svelte.ts";
  let { management }: { management: AiCompute } = $props();
  const id = $props.id();
  let tab = $state("models");
  const tabs = [
    { value: "models", label: "Models", Icon: BoxesIcon },
    { value: "resources", label: "Resources", Icon: CpuIcon },
    { value: "sharing", label: "Sharing", Icon: NetworkIcon },
  ];
  let importPath = $state("");
  const progress = $derived(
    management.value?.runtime.progress as {
      stage?: string;
      action?: string;
      downloaded_bytes?: number;
      total_bytes?: number;
    } | null,
  );
  const progressLabel = $derived(
    progress?.stage ??
      {
        prepare: "Preparing runtime",
        download: "Downloading weights",
        start: "Starting model",
        import: "Importing weights",
      }[progress?.action ?? ""] ??
      "Working",
  );
  const progressPercent = $derived(
    progress?.total_bytes
      ? Math.round(
          (100 * (progress.downloaded_bytes ?? 0)) / progress.total_bytes,
        )
      : null,
  );
  const blocked = $derived(management.busy || management.pending);
  const memoryInvalid = $derived(
    management.draft.memoryGb !== null &&
      (!Number.isSafeInteger(management.draft.memoryGb) ||
        management.draft.memoryGb < 1 ||
        management.draft.memoryGb > 1024),
  );
  $effect(() => {
    if (!management.value && !management.failed) void management.refresh();
  });
  async function save() {
    return management.command({
      type: "configure",
      settings: $state.snapshot(management.draft),
    });
  }
  async function run(action: ComputeAction) {
    if (await save()) await management.command(action);
  }
</script>

<div class="compute-settings" role="region" aria-label="Local compute">
  <Tabs.Root bind:value={tab}>
    <div class="settings-tab-strip">
      <ResponsiveTabs
        bind:value={tab}
        items={tabs.map((item) => ({ ...item, disabled: !management.value }))}
        inheritContext
        presentation="pill"
        label="Compute settings"
      />
    </div>
    {#if management.value}
      <Tabs.Content value="models" aria-label="Models">
        <p class="settings-tab-description">
          Local inference stays off until you start it. Models never download
          automatically or fall back to a cloud provider.
        </p>
        <div class="compute-settings-panel">
          <AiComputeModels {management} {id} {run} bind:importPath />
        </div>
      </Tabs.Content>
      <Tabs.Content value="resources" aria-label="Resources">
        <p class="settings-tab-description">
          Set the memory budget for this device. Changes apply the next time a
          model starts.
        </p>
        <div class="compute-settings-panel">
          <Field.Group style="gap:0"
            ><ComputeSettingRow
              id={`${id}-memory`}
              label="Max VRAM (GB)"
              description="Limit AI memory to 1–1024 GB. Leave empty for no explicit limit. On Apple silicon this uses unified memory. Applies on the next model start."
              ><QuantityInput
                id={`${id}-memory`}
                label="Max VRAM (GB)"
                layout="control"
                units={countUnits("GB")}
                min={1}
                max={1024}
                optional
                slider
                sliderMax={64}
                bind:draft={management.memoryDraft}
                value={management.draft.memoryGb === null
                  ? ""
                  : String(management.draft.memoryGb)}
                disabled={blocked}
                onValueChange={(value) =>
                  management.edit({
                    memoryGb: value.trim() ? Number(value) : null,
                  })}
              /></ComputeSettingRow
            ></Field.Group
          >
        </div></Tabs.Content
      >
      <Tabs.Content value="sharing" aria-label="Sharing">
        <p class="settings-tab-description">
          Pair trusted machines to share inference. Sharing is off by default
          and never grants access to application tools.
        </p>
        <div class="compute-settings-panel">
          <AiComputeSharing {management} />
        </div>
      </Tabs.Content>
      {#if management.value.runtime.importedModel}<div class="compute-state">
          Imported {management.value.runtime.importedModel}<Button
            variant="ghost"
            size="sm"
            disabled={blocked}
            onclick={() =>
              management.edit({
                model: management.value!.runtime.importedModel!,
              })}
            ><CheckIcon data-icon="inline-start" aria-hidden="true" />Use
            imported model</Button
          >
        </div>{/if}
      <div class="compute-state" role="status">
        {management.value.runtime.state ||
          "off"}{#if management.value.runtime.progress}<span>
            · {progressLabel}{progressPercent !== null
              ? ` ${progressPercent}%`
              : ""}</span
          >{/if}{#if management.value.outcome === "unknown"}<p>
            The previous operation has an unknown outcome. Stop and inspect
            before starting another operation.
          </p>{/if}
      </div>
    {:else if management.failed}<ClientSettingsEmpty
        Icon={CpuIcon}
        title="Compute settings unavailable"
        description="Refresh to check this device’s optional compute setup."
      />
    {:else}<div
        class="loading"
        role="status"
        aria-busy="true"
        aria-label="Loading compute settings"
      >
        {#each [1, 2, 3] as row (row)}<Skeleton style="height:2.5rem" />{/each}
      </div>{/if}
    <ClientSettingsFooter footer wrapActions>
      {#snippet description()}<p>
          Disabled startup · Explicit downloads · Inference only
        </p>{/snippet}
      <Button
        variant="ghost"
        size="sm"
        onclick={() => void management.refresh()}
        ><RefreshCwIcon data-icon="inline-start" aria-hidden="true" />Refresh
        compute</Button
      >
      <Button
        variant="outline"
        size="sm"
        disabled={!management.value || management.value.runtime.state === "off"}
        onclick={() => void management.stop().catch(() => management.refresh())}
        ><SquareIcon data-icon="inline-start" aria-hidden="true" />Stop compute</Button
      >
      <Button
        size="sm"
        disabled={blocked || memoryInvalid || !management.value}
        onclick={() => void save()}
        ><SaveIcon data-icon="inline-start" aria-hidden="true" />Save compute
        settings</Button
      >
    </ClientSettingsFooter>
  </Tabs.Root>
</div>

<style>
  .compute-settings {
    min-width: 0;
  }
  .compute-settings-panel {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
  }
  .compute-state {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }
  p:not(.settings-tab-description) {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted-foreground);
  }
  .loading {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
  }
</style>
