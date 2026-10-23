<!-- SPDX-License-Identifier: Apache-2.0 -->
<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { AgentCatalogScreen } from "@lapismd/agent-ui/screens";
  import { createCatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
  import type { AiCatalogProps } from "../../../lib/ai/catalog/props.ts";
  let props: AiCatalogProps = $props();
  const catalog = untrack(() => createCatalogState(props));
  const presentation = Object.create(catalog, {
    error: { get: () => catalog.error ?? "" },
    openedCatalogPath: { get: () => catalog.openedCatalogPath ?? "" },
  });
  onMount(catalog.mount);
</script>

<AgentCatalogScreen catalog={presentation} />
