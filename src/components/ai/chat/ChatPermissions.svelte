<!-- SPDX-License-Identifier: Apache-2.0; uses JJ Store's negotiated runtime-choice pattern. -->
<script lang="ts">
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import ChatModeMenuItems from "./ChatModeMenuItems.svelte";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
  import type { ExecutionMode } from "../../../lib/ai/core/agent-profile.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  import type { AiChatController } from "../../../lib/ai/chat/chat-controller.svelte.ts";
  let {
    panelProps,
    composerState,
    controller,
  }: {
    panelProps: AiChatPanelProps;
    composerState: ComposerState;
    controller: AiChatController;
  } = $props();
  let open = $state(false),
    loading = $state(false),
    modes = $state<Record<string, ExecutionMode[]>>({});
  const targets = $derived(
    composerState.recipients.selectedIds.length
      ? composerState.recipientOptions.filter((o) =>
          composerState.recipients.selectedIds.includes(o.id),
        )
      : [
          {
            id: composerState.selectedAgent,
            agent: composerState.selectedAgent,
            label: composerState.selectedAgent,
          },
        ],
  );
  const permissions = $derived(composerState.permissions);
  const labels = $derived(
    targets.map((target) => {
      const mode = permissions.effective(target);
      return modes[target.agent]?.find((m) => m.id === mode)?.name ?? mode;
    }),
  );
  const label = $derived(new Set(labels).size === 1 ? labels[0] : "Mixed");
  $effect(() => {
    const providers = [...new Set(targets.map((t) => t.agent))],
      load = panelProps.loadExecutionModes;
    if (!open || !load) return;
    let disposed = false;
    loading = true;
    modes = {};
    void Promise.all(
      providers.map(
        async (provider) => [provider, await load(provider, "acp")] as const,
      ),
    )
      .then((entries) => {
        if (!disposed) modes = Object.fromEntries(entries);
      })
      .catch((error) => {
        if (!disposed) permissions.report(error);
      })
      .finally(() => {
        if (!disposed) loading = false;
      });
    return () => {
      disposed = true;
    };
  });
  const unrestricted = (id: string) =>
    ["full-access", "bypassPermissions", "yolo", "danger-full-access"].includes(
      id,
    );
  const unrestrictedSelection = $derived(
    targets.some((t) => unrestricted(permissions.effective(t))),
  );
  const Icon = $derived(unrestrictedSelection ? ShieldAlertIcon : ShieldIcon);
  function choose(id: string, mode?: string) {
    open = false;
    void permissions.change(id, mode);
  }
</script>

<DropdownMenu.Sub bind:open>
  <DropdownMenu.SubTrigger
    disabled={panelProps.initializing ||
      controller.busy ||
      permissions.loading ||
      permissions.saving ||
      !!controller.importedSnapshot}
  >
    <Icon data-icon="inline-start" aria-hidden="true" />Mode: {label}
  </DropdownMenu.SubTrigger>
  <DropdownMenu.SubContent collisionPadding={8}>
    <ChatModeMenuItems {targets} {permissions} {modes} {loading} {choose} />
  </DropdownMenu.SubContent>
</DropdownMenu.Sub>
