<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { BackupSettingsFieldDefinition } from "./backup-settings.ts";
  import BackupSettings from "./BackupSettings.svelte";
  let { field }: Pick<WorkspaceCustomSettingProps, "field"> = $props();
  const panel = untrack(() =>
    (field as BackupSettingsFieldDefinition).openPanel(),
  );
  onDestroy(() => void panel.close().catch(panel.report));
</script>

<BackupSettings {...panel.props} />
