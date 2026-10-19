<!-- SPDX-License-Identifier: Apache-2.0; read-only local snapshot presentation. -->
<script lang="ts">
  import DriveIcon from "@lucide/svelte/icons/hard-drive";
  import LockIcon from "@lucide/svelte/icons/lock-keyhole";
  import PauseIcon from "@lucide/svelte/icons/pause";
  import MessagesIcon from "@lucide/svelte/icons/messages-square";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import codexIcon from "../../../lib/ai/presentation/assets/codex.svg";
  import ImportedTranscript from "../imports/ImportedTranscript.svelte";
  import AiTranscriptLoading from "../chat/AiTranscriptLoading.svelte";
  import TranscriptViewToggle from "./TranscriptViewToggle.svelte";
  import AiSessionShell from "./AiSessionShell.svelte";
  import CaptureVersionPicker from "./CaptureVersionPicker.svelte";
  import AiSessionMenu from "./AiSessionMenu.svelte";
  import {
    profileLabel,
    type SavedSessionGroup,
  } from "../../../lib/ai/session-browser/model.ts";
  let {
    sessions,
    loading = false,
    initialSelection = true,
    selected = $bindable<string | undefined>(undefined),
    selectedVersion = $bindable<string | undefined>(undefined),
    onSelectSession,
    onSelectVersion,
    onRefresh,
    previewLoading = false,
  }: {
    sessions: SavedSessionGroup[];
    loading?: boolean;
    initialSelection?: boolean;
    selected?: string;
    selectedVersion?: string;
    onSelectSession?: (group: string, version?: string) => void;
    onSelectVersion?: (id: string) => void;
    onRefresh?: () => void;
    previewLoading?: boolean;
  } = $props();
  let view = $state<"document" | "classic">("document");
  const session = $derived(sessions.find((s) => s.id === selected));
  const version = $derived(
    session?.versions.find((v) => v.id === selectedVersion),
  );
  const items = $derived(
    sessions.map((s) => ({
      id: s.id,
      title: s.title,
      profile: profileLabel(s.profile),
      group: s.group,
      updatedAt: s.versions[0].updatedAt,
      status: `${s.versions.length} versions`,
      harness: "codex",
    })),
  );
  function select(id: string) {
    const next = sessions.find((s) => s.id === id);
    const versionId =
      next?.versions.find((v) => !v.incomplete)?.id ?? next?.versions[0]?.id;
    if (onSelectSession) onSelectSession(id, versionId);
    else {
      selected = id;
      selectedVersion = versionId;
    }
  }
  $effect(() => {
    if (initialSelection && !selected && sessions[0]) select(sessions[0].id);
  });
</script>

<AiSessionShell
  {items}
  activeId={selected}
  title={session?.title ?? "Captured AI sessions"}
  status={session
    ? `${profileLabel(session.profile)} · Read-only local history`
    : "Locally saved session versions"}
  label="Captured sessions"
  {loading}
  busy={previewLoading}
  emptyTitle="No captured sessions"
  emptyDescription="Import a local session to save its captured history."
  onSelect={select}
>
  {#snippet actions()}<TranscriptViewToggle bind:view />
    {#if onRefresh}<AiSessionMenu
        busy={previewLoading}
        unavailable={false}
        refreshLabel="Refresh saved sessions"
        {onRefresh}
      />{/if}
  {/snippet}
  {#snippet listFooter()}<footer class="ai-session-list-footer">
      <div class="ai-session-status-items">
        <span class="ai-session-status-item"
          ><MessagesIcon aria-hidden="true" />{sessions.length} sessions</span
        >
        <span class="ai-session-status-item ai-session-status-item--end"
          ><PauseIcon aria-hidden="true" />Local only</span
        >
      </div>
    </footer>{/snippet}
  {#snippet footer()}<footer class="ai-session-footer">
      <div class="ai-session-status-items">
        {#if session && version}
          <div class="ai-session-status-item" style="padding-inline:0">
            <CaptureVersionPicker
              versions={session.versions}
              selected={selectedVersion}
              onSelect={(id) => {
                if (onSelectVersion) onSelectVersion(id);
                else selectedVersion = id;
              }}
            />
          </div>
          <span class="ai-session-status-item" role="status"
            ><DriveIcon aria-hidden="true" />{version.incomplete
              ? "Incomplete"
              : "Saved locally"}</span
          >
        {:else}<span class="ai-session-status-item"
            ><HistoryIcon aria-hidden="true" />Local history</span
          >{/if}
        <span class="ai-session-status-item ai-session-status-item--end"
          ><LockIcon aria-hidden="true" />Read-only</span
        >
      </div>
    </footer>{/snippet}
  {#if loading || previewLoading}<AiTranscriptLoading composer={false} />
  {:else if version?.entries && !version.incomplete}{#key version.id}<ImportedTranscript
        entries={version.entries}
        bind:view
        showViewToolbar={false}
        assistant={{ name: "Codex", image: codexIcon }}
      />{/key}
  {:else}<Empty.Root
      ><Empty.Header
        ><Empty.Media variant="icon"
          ><HistoryIcon aria-hidden="true" /></Empty.Media
        ><Empty.Title
          >{version?.incomplete
            ? "Incomplete local version"
            : "Choose a captured session"}</Empty.Title
        ><Empty.Description
          >{version?.incomplete
            ? "A complete saved snapshot is required before this version can be viewed."
            : "Choose a session on the left to read a saved version."}</Empty.Description
        ></Empty.Header
      ></Empty.Root
    >{/if}
</AiSessionShell>
