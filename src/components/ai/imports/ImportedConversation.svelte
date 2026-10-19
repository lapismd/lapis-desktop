<script lang="ts">
  import type { ConversationSnapshot } from "../../../lib/ai/conversations/types.ts";
  import ImportedTranscript from "./ImportedTranscript.svelte";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import DownloadIcon from "@lucide/svelte/icons/download";
  let { snapshot }: { snapshot: ConversationSnapshot } = $props();
</script>

{#if snapshot.metadata.imported?.state === "complete" && !snapshot.warnings.length}
  <ImportedTranscript entries={snapshot.transcript} />
{:else}
  <Empty.Root
    ><Empty.Header
      ><Empty.Media variant="icon"
        ><DownloadIcon aria-hidden="true" /></Empty.Media
      ><Empty.Title>Import is incomplete</Empty.Title><Empty.Description
        >Return to the original source preview and retry this snapshot to verify
        and complete its saved entries.</Empty.Description
      ></Empty.Header
    ></Empty.Root
  >
{/if}
