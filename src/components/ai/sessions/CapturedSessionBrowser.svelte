<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { CapturedSessionBrowser } from "@lapismd/agent-ui/sessions";
  import type { SavedSessionGroup } from "../../../lib/ai/session-browser/model.ts";
  import { projectRecordedTranscript } from "../../../lib/ai/presentation/recorded-transcript.ts";
  import { transcriptLinks } from "../chat/transcript-agent-links.ts";
  let {
    app,
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
    app?: App | undefined;
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
  const captures = $derived(
    sessions.map((group) => ({
      ...group,
      versions: group.versions.map((version) => ({
        ...version,
        entries: version.entries
          ? projectRecordedTranscript(version.entries)
          : undefined,
      })),
    })),
  );
  const transcriptOptions = $derived(transcriptLinks(app, "", [], true));
</script>

<CapturedSessionBrowser
  sessions={captures}
  {loading}
  {initialSelection}
  bind:selected
  bind:selectedVersion
  {onSelectSession}
  {onSelectVersion}
  {onRefresh}
  {previewLoading}
  {transcriptOptions}
/>
