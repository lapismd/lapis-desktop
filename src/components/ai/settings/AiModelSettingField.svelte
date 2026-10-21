<script lang="ts">
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type {
    WorkspaceSettingsController,
    WorkspaceStringSetting,
  } from "@lapismd/design-core/workspace/settings";
  import ChatAgentModelSelect from "../chat/agents/ChatAgentModelSelect.svelte";
  type ModelField = WorkspaceCustomSettingProps["field"] & {
    modelDefinition: WorkspaceStringSetting;
    modelCatalogRevision: number;
    settingsController: WorkspaceSettingsController;
  };
  let {
    id,
    field,
    value,
    disabled,
    busy,
    setValue,
  }: WorkspaceCustomSettingProps = $props();
  const modelField = $derived(field as ModelField);
  let options = $state<{ id: string; name: string; description?: string }[]>(
    [],
  );
  $effect(() => {
    const { modelDefinition, modelCatalogRevision, settingsController } =
      modelField;
    let current = true;
    options = [];
    void settingsController
      .loadOptions(modelDefinition.optionsSource!, {
        settingId: modelDefinition.id,
        params: {
          ...modelDefinition.optionsSourceParams,
          revision: modelCatalogRevision,
        },
      })
      .then((rows) => {
        if (current)
          options = rows.map((row) => ({
            id: row.value,
            name: row.label,
            description: row.description,
          }));
      })
      .catch(() => {
        // Registered model sources own discovery feedback; disposal can revoke them.
        if (current) options = [];
      });
    return () => {
      current = false;
    };
  });
</script>

<div class="ai-model-setting-field">
  <ChatAgentModelSelect
    {id}
    bind:value={
      () => String(value ?? ""),
      (next) => {
        if (typeof next === "string") void setValue(next);
      }
    }
    {options}
    ariaLabel={field.title}
    disabled={disabled || busy}
    allowDefault={false}
    defaultLabel="Choose a model"
  />
</div>

<style>
  .ai-model-setting-field {
    --ui-button-height: var(--ui-workspace-settings-control-height);
    --ui-button-radius: var(--ui-workspace-settings-control-radius);
    flex: 1 1 0;
    min-width: 0;
    max-width: 20rem;
  }
</style>
