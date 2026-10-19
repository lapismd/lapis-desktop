<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App } from "@lapis-notes/api";
  import type { ConversationRepository } from "../../../lib/ai/conversations/conversation-repository.ts";
  import type { ConversationLocation } from "../../../lib/ai/conversations/types.ts";
  import CapturedSessionBrowser from "../sessions/CapturedSessionBrowser.svelte";
  import { createSavedHistory } from "../../../lib/ai/session-browser/saved-history.svelte.ts";
  import type { ConversationSnapshot } from "../../../lib/ai/conversations/types.ts";
  import ImportedTranscript from "./ImportedTranscript.svelte";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import DownloadIcon from "@lucide/svelte/icons/download";
  let {
    snapshot,
    app,
    repository,
    onDispose,
    onLocationChange,
  }: {
    snapshot: ConversationSnapshot;
    app?: App;
    repository?: ConversationRepository;
    onDispose?: (operation: Promise<void>) => void;
    onLocationChange?: (location: ConversationLocation) => void;
  } = $props();
  const history = untrack(() =>
    app && repository
      ? createSavedHistory({
          app,
          repository,
          snapshot,
          onLocationChange,
        })
      : undefined,
  );
  onMount(() => {
    const unsubscribe = history?.mount();
    return () => {
      unsubscribe?.();
      if (history) {
        const closing = history.close();
        if (onDispose) onDispose(closing);
        else void closing;
      }
    };
  });
</script>

{#if history}
  <CapturedSessionBrowser
    sessions={history.groups}
    selected={history.selected}
    selectedVersion={history.selectedVersion}
    previewLoading={history.loading}
    initialSelection={false}
    onSelectSession={(_, version) => {
      if (version) void history.select(version);
    }}
    onSelectVersion={(id) => void history.select(id)}
    onRefresh={() => void history.refresh()}
  />
{:else if snapshot.metadata.imported?.state === "complete" && !snapshot.warnings.length}
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
