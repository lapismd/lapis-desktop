<script lang="ts">
  import type { Snippet } from "svelte";
  import type { App } from "@lapis-notes/api";
  import type { TranscriptItem } from "@lapismd/design-core/chat";
  import type { TranscriptEntry } from "../../../lib/ai/conversations/types.ts";
  import { AgentRecordedTranscript } from "@lapismd/agent-ui/sessions";
  import { projectRecordedTranscript } from "../../../lib/ai/presentation/recorded-transcript.ts";
  import { transcriptLinks } from "../chat/transcript-agent-links.ts";
  import "../../../styles/ai/transcript-links.css";
  let {
    app,
    sourcePath = "",
    entries = [],
    projectedItems,
    view = $bindable<"document" | "classic">("document"),
    showViewToolbar = true,
    assistant,
    inspectTools = false,
    toolInspector = $bindable<Snippet | undefined>(),
    capturedUser = true,
    label = "Imported transcript preview",
    composer,
    busy = false,
    agentOptions = [],
  }: {
    app?: App | undefined;
    sourcePath?: string;
    entries?: TranscriptEntry[];
    projectedItems?: readonly TranscriptItem[];
    view?: "document" | "classic";
    showViewToolbar?: boolean;
    assistant?: { name: string; image: string };
    inspectTools?: boolean;
    toolInspector?: Snippet;
    capturedUser?: boolean;
    label?: string;
    composer?: Snippet<["document" | "classic"]>;
    busy?: boolean;
    agentOptions?: readonly import("../../../lib/ai/conversations/recipients.ts").AgentRecipientOption[];
  } = $props();
  const items = $derived(
    projectRecordedTranscript(entries, {
      projectedItems,
      capturedUser,
      assistant,
      inspectTools,
    }),
  );
  const options = $derived(
    transcriptLinks(app, sourcePath, agentOptions, true),
  );
</script>

<AgentRecordedTranscript
  projectedItems={items}
  bind:view
  bind:toolInspector
  {showViewToolbar}
  {assistant}
  {inspectTools}
  {capturedUser}
  {label}
  {composer}
  {busy}
  {options}
/>
