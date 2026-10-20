<script lang="ts">
  import { untrack } from "svelte";
  import type {
    WorkspaceCustomSetting,
    WorkspaceCustomSettingProps,
  } from "@lapis-notes/api";
  import type { AgentProfileManagement } from "../../../lib/ai/settings/agent-profile-editor.ts";
  import AgentProfilesSettings from "./AgentProfilesSettings.svelte";
  let { field }: Pick<WorkspaceCustomSettingProps, "field"> = $props();
  const management = untrack(
    () =>
      (field as WorkspaceCustomSetting & { management: AgentProfileManagement })
        .management,
  );
</script>

<AgentProfilesSettings {management} />
