<script lang="ts">
  import { untrack } from "svelte";
  import type {
    WorkspaceCustomSettingProps,
    WorkspaceCustomSetting,
  } from "@lapis-notes/api";
  import type { AgentClients } from "../../../lib/ai/settings/clients.svelte.ts";
  import AgentClientsSettings from "./AgentClientsSettings.svelte";
  let { field }: Pick<WorkspaceCustomSettingProps, "field"> = $props();
  const management = untrack(
    () =>
      (field as WorkspaceCustomSetting & { management: AgentClients })
        .management,
  );
</script>

<AgentClientsSettings {management} />
