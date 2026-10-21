<!-- Factored from AiComputeSettings; JJ Store adaptation, Apache-2.0. -->
<script lang="ts">
  import ComputeSettingRow from "./ComputeSettingRow.svelte";
  import AiComputeModelPicker from "./AiComputeModelPicker.svelte";
  import AiComputeLibrary from "./AiComputeLibrary.svelte";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { FilePathInput } from "@lapismd/design-core/forms/file-path-input";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import PackageCheckIcon from "@lucide/svelte/icons/package-check";
  import FileInputIcon from "@lucide/svelte/icons/file-input";
  import type {
    AiCompute,
    ComputeAction,
  } from "../../../lib/ai/settings/compute.svelte.ts";
  let {
    management,
    id,
    run,
    importPath = $bindable(""),
  }: {
    management: AiCompute;
    id: string;
    run: (action: ComputeAction) => Promise<void>;
    importPath?: string;
  } = $props();
  const blocked = $derived(management.busy || management.pending);
</script>

<div class="models">
  <AiComputeLibrary {management} {run} />
  <div class="model-controls">
    <Field.Group style="gap:0">
      <ComputeSettingRow
        id={`${id}-model`}
        label="Add model"
        description="Choose a model with estimated memory fit, then download weights explicitly."
      >
        <AiComputeModelPicker
          id={`${id}-model`}
          value={management.draft.model}
          onValueChange={(model) => management.edit({ model })}
          models={management.value?.models ?? []}
          hardware={management.value?.hardware}
          memoryLimit={management.draft.memoryGb}
          disabled={blocked || management.value?.runtime.state === "serving"}
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
          disabled={blocked || management.value?.runtime.state === "serving"}
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
            ><PackageCheckIcon
              data-icon="inline-start"
              aria-hidden="true"
            />Prepare runtime</Button
          ><Button
            variant="outline"
            size="sm"
            disabled={blocked ||
              !management.draft.model ||
              management.value?.runtime.state === "serving"}
            onclick={() => void run({ type: "download" })}
            ><DownloadIcon
              data-icon="inline-start"
              aria-hidden="true"
            />Download model</Button
          >
        </div>
      </ComputeSettingRow>
      <ComputeSettingRow
        id={`${id}-import`}
        label="Import GGUF"
        description="Import a local file into this device’s managed model storage."
      >
        <FilePathInput
          id={`${id}-import`}
          label="Import GGUF"
          bind:value={importPath}
          disabled={blocked}
          placeholder="/absolute/path/model.gguf"
          onBrowse={management.canPickFile
            ? () => management.pickFile()
            : undefined}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={blocked || !importPath.startsWith("/")}
          onclick={() => void run({ type: "import", path: importPath })}
          ><FileInputIcon data-icon="inline-start" aria-hidden="true" />Import
          model</Button
        >
      </ComputeSettingRow>
    </Field.Group>
  </div>
</div>

<style>
  .models {
    display: grid;
    gap: 1rem;
    min-width: 0;
  }
  .model-controls {
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--background);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
