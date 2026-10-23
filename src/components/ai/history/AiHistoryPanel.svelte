<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { AgentHistoryScreen } from "@lapismd/agent-ui/screens";
  import { createHistoryState } from "../../../lib/ai/history/state.svelte.ts";
  import type { AiHistoryProps } from "../../../lib/ai/history/props.ts";
  let props: AiHistoryProps = $props();
  const history = untrack(() => createHistoryState(props));
  const presentation = Object.create(history, {
    error: { get: () => history.error ?? "" },
  });
  onMount(history.mount);
</script>

<AgentHistoryScreen history={presentation} />
