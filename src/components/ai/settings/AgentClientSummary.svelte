<!-- Copied and adapted from jj-store StoreAgentRuntimeSummary.svelte. -->
<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Avatar } from "@lapismd/design-core/shadcn/avatar";
  import { agentAvatar } from "../../../lib/ai/presentation/agent-avatar.ts";
  import type { AgentClient as Runtime } from "../../../lib/ai/settings/clients.svelte.ts";
  let { runtime, status }: { runtime: Runtime; status: Runtime["state"] } =
    $props();
  const labels: Record<string, string> = {
    ready: "Ready",
    bundle_needed: "Bundle needed",
    cli_missing: "CLI needed",
    adapter_needed: "Adapter needed",
    update_available: "Update available",
    node_needed: "Node.js needed",
    installing: "Installing…",
    unknown: "Unknown",
    not_admitted: "Not enabled",
  };
</script>

<div class="store-runtime__summary">
  <Avatar
    src={runtime.id === "local" ? "/lapis-logo.svg" : agentAvatar(runtime.id)}
    name={runtime.label}
    size="md"
    decorative
  />
  <div class="store-runtime__copy">
    <div class="store-runtime__identity">
      <strong>{runtime.label}</strong>
      <Badge variant="outline">
        {#if status === "ready"}<CheckIcon aria-hidden="true" />{/if}{labels[
          status
        ] ?? "Unknown"}
      </Badge>
    </div>
    <p class="store-runtime__description">
      {runtime.detail}
    </p>
    {#if runtime.adapter_version || runtime.cli_version}
      <p class="store-runtime__description">
        {runtime.adapter_version ? `ACP ${runtime.adapter_version} · ` : ""}
        {runtime.cli_version
          ? `CLI ${runtime.cli_version} · `
          : ""}{runtime.managed ? "Managed by Lapis" : "Device installation"}
      </p>
    {/if}
  </div>
</div>
