<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { untrack } from "svelte";
  import type {
    WorkspaceCustomSetting,
    WorkspaceCustomSettingProps,
  } from "@lapis-notes/api";
  import type { NativeConversationSettingsManagement } from "../../../lib/ai/settings/native-conversation-settings.ts";
  import NativeConversationStorageSettings from "./NativeConversationStorageSettings.svelte";
  let { field }: Pick<WorkspaceCustomSettingProps, "field"> = $props();
  const management = untrack(
    () =>
      (
        field as WorkspaceCustomSetting & {
          management?: NativeConversationSettingsManagement;
        }
      ).management,
  );
</script>

<NativeConversationStorageSettings {management} />
