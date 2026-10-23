<!-- SPDX-License-Identifier: Apache-2.0; retained Lapis AI presentation. -->
<script lang="ts">
  import type { AgentResultViewProps, App } from "@lapis-notes/api";
  import { AgentInventoryResult } from "@lapismd/agent-ui/chat";
  import type { AiChatInventory } from "../../../lib/ai/chat/chat-items.ts";

  let { app, output }: Partial<AgentResultViewProps<App>> = $props();

  const inventory = $derived.by((): AiChatInventory | undefined => {
    if (!output || typeof output !== "object" || Array.isArray(output)) {
      return undefined;
    }
    const record = output as Partial<AiChatInventory>;
    if (record.kind !== "skills" && record.kind !== "tools") return undefined;
    if (!Array.isArray(record.items)) return undefined;
    return record as AiChatInventory;
  });

  async function openPath(path: string) {
    await app?.workspace.openLinkText(path, "");
  }
</script>

<AgentInventoryResult
  output={inventory}
  onOpenPath={app ? openPath : undefined}
/>
