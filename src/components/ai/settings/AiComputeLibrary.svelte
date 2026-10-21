<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import CheckIcon from "@lucide/svelte/icons/circle-check";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import BoxIcon from "@lucide/svelte/icons/box";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import ClientSettingsCard from "./ClientSettingsCard.svelte";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import AiComputeModelSummary from "./AiComputeModelSummary.svelte";
  import AiComputeRunButton from "./AiComputeRunButton.svelte";
  import type {
    AiCompute,
    ComputeAction,
    ComputeStatus,
  } from "../../../lib/ai/settings/compute.svelte.ts";
  let {
    management,
    run,
  }: { management: AiCompute; run: (action: ComputeAction) => Promise<void> } =
    $props();
  let removing = $state<ComputeStatus["models"][number] | null>(null);
  const blocked = $derived(management.busy || management.pending);
  const serving = $derived(management.value?.runtime.state === "serving");
  const id = $props.id();
</script>

<ClientSettingsCard
  id={`${id}-downloaded-title`}
  title="Downloaded models"
  description="Models stored on this device. Choose a model to start local inference."
  Icon={BoxIcon}
>
  {#if !management.value?.models.length}
    <ClientSettingsEmpty
      Icon={BoxIcon}
      title="No downloaded models"
      description="Add a model or import GGUF weights to run inference on this machine."
    />
  {:else}
    <div class="store-runtime__list">
      {#each management.value.models as model (model.id)}
        {@const running =
          serving && management.value.runtime.activeModel === model.id}
        <ClientSettingsFooter wrapActions>
          {#snippet description()}<AiComputeModelSummary
              {model}
              {running}
              selected={management.draft.model === model.id}
            />{/snippet}

          <Button
            variant="ghost"
            size="sm"
            disabled={blocked ||
              serving ||
              !model.installed ||
              management.draft.model === model.id}
            aria-label={`Use model ${model.name}`}
            onclick={() => management.edit({ model: model.id })}
            ><CheckIcon data-icon="inline-start" aria-hidden="true" />Use model</Button
          >
          <AiComputeRunButton
            name={model.name}
            {running}
            disabled={!running &&
              (blocked ||
                serving ||
                !model.installed ||
                !management.value.runtimePrepared)}
            onActivate={async () => {
              if (running) await management.stop();
              else {
                management.edit({ model: model.id });
                await run({ type: "start" });
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={blocked || serving}
            aria-label={`Remove ${model.name}`}
            onclick={() => (removing = model)}
            ><TrashIcon aria-hidden="true" /></Button
          >
        </ClientSettingsFooter>
      {/each}
    </div>
    {#if !management.value.runtimePrepared}<p
        class="store-settings__row-description"
      >
        Prepare the runtime to enable Start. Existing model weights will be
        retained.
      </p>{/if}
  {/if}
</ClientSettingsCard>
<AlertDialog.Root
  open={removing !== null}
  onOpenChange={(open) => {
    if (!open) removing = null;
  }}
>
  <AlertDialog.Content>
    <AlertDialog.Header
      ><AlertDialog.Title>Remove downloaded model?</AlertDialog.Title
      ><AlertDialog.Description
        >Remove {removing?.name} from this device’s managed storage. The original
        imported file is kept. You can download or import the model again.</AlertDialog.Description
      ></AlertDialog.Header
    >
    <AlertDialog.Footer
      ><AlertDialog.Cancel>Cancel</AlertDialog.Cancel><AlertDialog.Action
        disabled={blocked || serving}
        onclick={async () => {
          const model = removing;
          removing = null;
          if (model) await run({ type: "remove", model: model.id });
        }}>Remove weights</AlertDialog.Action
      ></AlertDialog.Footer
    >
  </AlertDialog.Content>
</AlertDialog.Root>
