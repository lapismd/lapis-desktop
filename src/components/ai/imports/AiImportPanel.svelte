<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    AgentImportsScreen,
    type AgentImportPresentation,
  } from "@lapismd/agent-ui/screens";
  import {
    createImportState,
    type AiImportProps,
  } from "../../../lib/ai/imports/state.svelte.ts";
  import { projectRecordedTranscript } from "../../../lib/ai/presentation/recorded-transcript.ts";
  import { transcriptLinks } from "../chat/transcript-agent-links.ts";
  let props: AiImportProps = $props();
  const imports = untrack(() => createImportState(props));
  // Getters keep provisional native reads reactive. Saving uses the original validated capture.
  const state: AgentImportPresentation = untrack(() =>
    Object.create(imports, {
      entries: { get: () => projectRecordedTranscript(imports.entries) },
      available: { get: () => !!props.sources },
      canOpen: { get: () => !!props.onOpen },
      saved: {
        get: () =>
          imports.saved
            ? {
                id: JSON.stringify(imports.saved.location),
                duplicate: imports.saved.duplicate,
              }
            : undefined,
      },
    }),
  );
  onMount(() => {
    if (props.sources)
      void imports.browser.loadHarness("codex", true).then(() => {
        if (props.initialSelector) void imports.restore(props.initialSelector);
      });
    return () => props.onDispose(imports.close());
  });
</script>

<AgentImportsScreen
  imports={state}
  options={transcriptLinks(props.app, "", [], true)}
/>
