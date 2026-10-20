<!-- SPDX-License-Identifier: Apache-2.0; uses JJ Store's negotiated runtime-choice pattern. -->
<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
  import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
  import HandIcon from "@lucide/svelte/icons/hand";
  import CheckIcon from "@lucide/svelte/icons/check";
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
  const modeIcon = (id: string) =>
    unrestricted(id)
      ? ShieldAlertIcon
      : ["ask", "read-only"].includes(id)
        ? HandIcon
        : ShieldCheckIcon;
  const unrestrictedSelection = $derived(
    targets.some((t) => unrestricted(permissions.effective(t))),
  );
  const Icon = $derived(unrestrictedSelection ? ShieldAlertIcon : ShieldIcon);
  function choose(id: string, mode?: string) {
    open = false;
    void permissions.change(id, mode);
  }
</script>

<Popover.Root bind:open>
  <Tooltip.Provider
    ><Tooltip.Root>
      <Tooltip.Trigger
        >{#snippet child({ props: hint })}
          <Popover.Trigger
            >{#snippet child({ props })}
              <Button
                {...hint}
                {...props}
                size="icon-sm"
                variant="ghost"
                class="chat-permissions"
                data-unrestricted={unrestrictedSelection || undefined}
                aria-label={`Permissions: ${label}`}
                disabled={panelProps.initializing ||
                  controller.busy ||
                  permissions.loading ||
                  permissions.saving ||
                  !!controller.importedSnapshot}
              >
                <Icon aria-hidden="true" />
              </Button>
            {/snippet}</Popover.Trigger
          >
        {/snippet}</Tooltip.Trigger
      >
      <Tooltip.Content>Permissions: {label}</Tooltip.Content>
    </Tooltip.Root></Tooltip.Provider
  >
  <Popover.Content
    side="top"
    align="start"
    sideOffset={8}
    collisionPadding={8}
    style="--ui-popover-width: min(30rem, calc(100vw - 1rem)); --ui-popover-padding: 0.5rem;"
  >
    <Popover.Title class="permission-heading"
      >How should agent actions be approved?</Popover.Title
    >
    <CommandView.Root label="Agent permissions" shouldFilter={false} loop>
      <CommandView.List>
        {#each targets as target (target.id)}
          <CommandView.Group
            heading={targets.length > 1 ? target.label : undefined}
          >
            <CommandView.Item
              value={`${target.id}:inherit`}
              onSelect={() => choose(target.id)}
            >
              <CommandView.ItemIcon
                ><ShieldIcon aria-hidden="true" /></CommandView.ItemIcon
              >
              <CommandView.ItemLabel>Use agent default</CommandView.ItemLabel>
              <CommandView.ItemDescription
                >{target.label} · {target.executionMode ??
                  "Reviewed client default"}</CommandView.ItemDescription
              >
              {#if !Object.hasOwn(permissions.overrides, target.id)}<CheckIcon
                  aria-hidden="true"
                />{/if}
            </CommandView.Item>
            {#each modes[target.agent] ?? [] as mode (mode.id)}
              {@const RowIcon = modeIcon(mode.id)}
              <CommandView.Item
                value={`${target.id}:${mode.id}`}
                disabled={loading}
                class="permission-option"
                data-unrestricted={unrestricted(mode.id) || undefined}
                onSelect={() => choose(target.id, mode.id)}
              >
                <CommandView.ItemIcon
                  ><RowIcon aria-hidden="true" /></CommandView.ItemIcon
                >
                <CommandView.ItemLabel>{mode.name}</CommandView.ItemLabel>
                <CommandView.ItemDescription
                  >{mode.description ??
                    "Provider-defined execution mode"}</CommandView.ItemDescription
                >
                {#if permissions.overrides[target.id] === mode.id}<CheckIcon
                    aria-hidden="true"
                  />{/if}
              </CommandView.Item>
            {/each}
            {#if loading}<CommandView.Item
                value={`${target.id}:loading`}
                disabled>Loading permissions…</CommandView.Item
              >
            {:else if !modes[target.agent]?.length}<CommandView.Item
                value={`${target.id}:unavailable`}
                disabled>No selectable modes advertised</CommandView.Item
              >{/if}
            {#if !loading && !(modes[target.agent] ?? []).some((m) => m.id === permissions.effective(target))}<CommandView.Item
                value={`${target.id}:saved`}
                disabled
                >Saved mode: {permissions.effective(target)}</CommandView.Item
              >{/if}
          </CommandView.Group>
        {/each}
      </CommandView.List>
    </CommandView.Root>
    <p class="permission-note">
      Applies to this conversation’s future turns. Lapis tool approvals still
      apply.
    </p>
  </Popover.Content>
</Popover.Root>

<style>
  :global(.chat-permissions) {
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border-radius: 50%;
  }
  :global(.chat-permissions[data-state="open"]) {
    background: var(--muted);
  }
  :global(.chat-permissions[data-unrestricted="true"]) {
    color: var(--warning, var(--destructive));
    background: color-mix(
      in srgb,
      var(--warning, var(--destructive)) 8%,
      var(--background)
    );
  }
  :global(.permission-heading) {
    color: var(--muted-foreground);
    font-size: 0.8125rem;
    font-weight: 400;
    margin: 0;
    padding: 0.375rem 0.625rem;
  }
  .permission-note {
    color: var(--muted-foreground);
    font-size: 0.75rem;
    margin: 0;
    padding: 0.375rem 0.625rem;
    line-height: 1.4;
  }
  :global(.permission-option[data-unrestricted="true"]) {
    color: var(--warning, var(--destructive));
  }
</style>
