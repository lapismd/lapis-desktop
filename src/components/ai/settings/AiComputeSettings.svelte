<!-- Adapted from JJ Store StoreComputeSettings/StoreComputeModels; Apache-2.0. -->
<script lang="ts">
  import ClientSettingsCard from "./ClientSettingsCard.svelte";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import ComputeSettingRow from "./ComputeSettingRow.svelte";
  import AiComputeSharing from "./AiComputeSharing.svelte";
  import AiComputeModelPicker from "./AiComputeModelPicker.svelte";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import CpuIcon from "@lucide/svelte/icons/cpu";
  import type {
    AiCompute,
    ComputeAction,
  } from "../../../lib/ai/settings/compute.svelte.ts";
  let { management }: { management: AiCompute } = $props();
  const id = $props.id();
  let tab = $state("models");
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

<ClientSettingsCard
  id={`${id}-card`}
  title="Local compute"
  description="Local inference stays off until you start it. Models never download automatically or fall back to a cloud provider."
  Icon={CpuIcon}
>
  {#if management.value}
    <Tabs.Root bind:value={tab}>
      <Tabs.List style="margin:.75rem 1rem"
        ><Tabs.Trigger value="models">Models</Tabs.Trigger><Tabs.Trigger
          value="resources">Resources</Tabs.Trigger
        ><Tabs.Trigger value="sharing">Sharing</Tabs.Trigger></Tabs.List
      >
      <Tabs.Content value="models">
        <Field.Group style="gap:0">
          <ComputeSettingRow
            id={`${id}-model`}
            label="Model"
            description="Choose a model with estimated memory fit, then download weights explicitly."
          >
            <AiComputeModelPicker
              id={`${id}-model`}
              value={management.draft.model}
              onValueChange={(model) => management.edit({ model })}
              models={[]}
              hardware={management.value.hardware}
              memoryLimit={management.draft.memoryGb}
              disabled={blocked || management.value.runtime.state === "serving"}
            />
          </ComputeSettingRow>
          <ComputeSettingRow
            id={`${id}-custom`}
            label="Custom model"
            description="Hugging Face GGUF reference or the exact identity of an imported model."
          >
            <Input
              id={`${id}-custom`}
              value={management.draft.model ?? ""}
              disabled={blocked || management.value.runtime.state === "serving"}
              placeholder="unsloth/Qwen3-0.6B-GGUF:Q4_K_M"
              oninput={(event) =>
                management.edit({
                  model: event.currentTarget.value.trim() || null,
                })}
            />
          </ComputeSettingRow>
          <ComputeSettingRow
            id={`${id}-lifecycle`}
            label="Model controls"
            description="Prepare installs the native inference runtime. Download explicitly retrieves the selected weights. Start only uses installed weights."
          >
            <div class="actions">
              <Button
                variant="outline"
                size="sm"
                disabled={blocked}
                onclick={() => void run({ type: "prepare" })}
                >Prepare runtime</Button
              ><Button
                variant="outline"
                size="sm"
                disabled={blocked || !management.draft.model}
                onclick={() => void run({ type: "download" })}
                >Download model</Button
              ><Button
                size="sm"
                disabled={blocked ||
                  !management.draft.model ||
                  management.value.runtime.state === "serving"}
                onclick={() => void run({ type: "start" })}>Start model</Button
              >
            </div>
          </ComputeSettingRow>
          <ComputeSettingRow
            id={`${id}-import`}
            label="Import GGUF"
            description="Import a local file into this device’s managed model storage."
          >
            <Input
              id={`${id}-import`}
              bind:value={importPath}
              disabled={blocked}
              placeholder="/absolute/path/model.gguf"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={blocked || !importPath.startsWith("/")}
              onclick={() => void run({ type: "import", path: importPath })}
              >Import model</Button
            >
          </ComputeSettingRow>
        </Field.Group>
      </Tabs.Content>
      <Tabs.Content value="resources"
        ><Field.Group style="gap:0"
          ><ComputeSettingRow
            id={`${id}-memory`}
            label="Max VRAM (GB)"
            description="Limit AI memory to 1–1024 GB. Leave empty for no explicit limit. On Apple silicon this uses unified memory. Applies on the next model start."
            ><Input
              id={`${id}-memory`}
              type="number"
              min={1}
              max={1024}
              value={management.draft.memoryGb ?? ""}
              disabled={blocked}
              aria-invalid={memoryInvalid}
              oninput={(event) =>
                management.edit({
                  memoryGb: event.currentTarget.value.trim()
                    ? Number(event.currentTarget.value)
                    : null,
                })}
            /></ComputeSettingRow
          ></Field.Group
        ></Tabs.Content
      >
      <Tabs.Content value="sharing"
        ><AiComputeSharing {management} /></Tabs.Content
      >
    </Tabs.Root>
    {#if management.value.runtime.importedModel}<div class="compute-state">
        Imported {management.value.runtime.importedModel}<Button
          variant="ghost"
          size="sm"
          disabled={blocked}
          onclick={() =>
            management.edit({
              model: management.value!.runtime.importedModel!,
            })}>Use imported model</Button
        >
      </div>{/if}
    <div class="compute-state" role="status">
      {management.value.runtime.state ||
        "off"}{#if management.value.runtime.progress}<span>
          · {progressLabel}{progressPercent !== null
            ? ` ${progressPercent}%`
            : ""}</span
        >{/if}{#if management.value.outcome === "unknown"}<p>
          The previous operation has an unknown outcome. Stop and inspect before
          starting another operation.
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
  <ClientSettingsFooter footer>
    {#snippet description()}<p>
        Disabled startup · Explicit downloads · Inference only
      </p>{/snippet}
    <Button variant="ghost" size="sm" onclick={() => void management.refresh()}
      >Refresh compute</Button
    >
    <Button
      variant="outline"
      size="sm"
      disabled={!management.value || management.value.runtime.state === "off"}
      onclick={() => void management.stop().catch(() => management.refresh())}
      >Stop compute</Button
    >
    <Button
      size="sm"
      disabled={blocked || memoryInvalid || !management.value}
      onclick={() => void save()}>Save compute settings</Button
    >
  </ClientSettingsFooter>
</ClientSettingsCard>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .compute-state {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }
  p {
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
