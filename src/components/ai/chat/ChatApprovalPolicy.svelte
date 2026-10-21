<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import HandIcon from "@lucide/svelte/icons/hand";
  import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
  import CheckIcon from "@lucide/svelte/icons/check";
  import {
    APPROVAL_POLICIES,
    normalizeApprovalPolicy,
    type ApprovalPolicy,
  } from "../../../lib/ai/core/approval-policy.ts";
  import type { AiChatPanelProps } from "../../../lib/ai/chat/panel/props.ts";
  import type { ComposerState } from "../../../lib/ai/chat/panel/composer.svelte.ts";
  let {
    panelProps,
    composerState,
  }: { panelProps: AiChatPanelProps; composerState: ComposerState } = $props();
  let open = $state(false),
    saving = $state(false);
  const policy = $derived(
    normalizeApprovalPolicy(panelProps.settings?.approvalPolicy),
  );
  const selected = $derived(APPROVAL_POLICIES.find((p) => p.value === policy)!);
  const overrides = $derived(
    composerState.recipientOptions.filter(
      (p) =>
        p.approvalPolicy &&
        (composerState.recipients.selectedIds.length
          ? composerState.recipients.selectedIds.includes(p.id)
          : p.id === composerState.selectedAgent),
    ),
  );
  async function choose(value: ApprovalPolicy) {
    if (saving || !panelProps.onSettingsChange) return;
    saving = true;
    try {
      await panelProps.onSettingsChange({ approvalPolicy: value });
      await panelProps.app?.notifications.clear("ai-approval-policy-save");
      open = false;
    } catch (error) {
      panelProps.app?.notifications.notify({
        id: "ai-approval-policy-save",
        source: "ai",
        title: "Action approvals",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      saving = false;
    }
  }
</script>

<Popover.Root bind:open>
  <Tooltip.Provider
    ><Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props: tooltipProps })}
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                {...tooltipProps}
                {...props}
                variant="ghost"
                size="icon-sm"
                aria-label={`Action approvals: ${selected.label}${overrides.length ? " (agent override)" : ""}`}
                data-testid="ai-chat-approval-policy"
                data-auto-approve={policy === "allow-all"}
                disabled={saving ||
                  panelProps.initializing ||
                  !panelProps.onSettingsChange}
              >
                {#if policy === "allow-all"}<ShieldCheckIcon
                    aria-hidden="true"
                  />{:else}<HandIcon aria-hidden="true" />{/if}
              </Button>
            {/snippet}
          </Popover.Trigger>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content
        >Action approvals: {selected.label}{overrides.length
          ? " · Agent override applies"
          : ""}</Tooltip.Content
      >
    </Tooltip.Root></Tooltip.Provider
  >
  <Popover.Content
    side="top"
    align="end"
    collisionPadding={8}
    class="approval-policy-popover"
  >
    <CommandView.Root>
      <CommandView.List aria-label="Action approval policy">
        <CommandView.Group heading="Default for all chats in this vault">
          {#each APPROVAL_POLICIES as option}
            <CommandView.Item
              value={option.value}
              disabled={saving}
              onSelect={() => void choose(option.value)}
              aria-label={option.label}
            >
              <CommandView.ItemIcon
                >{#if option.value === "ask"}<HandIcon
                    aria-hidden="true"
                  />{:else}<ShieldCheckIcon
                    aria-hidden="true"
                  />{/if}</CommandView.ItemIcon
              >
              <CommandView.ItemLabel>{option.label}</CommandView.ItemLabel>
              <CommandView.ItemDescription
                >{option.description}</CommandView.ItemDescription
              >
              {#if policy === option.value}<CommandView.Shortcut
                  ><CheckIcon aria-label="Selected" /></CommandView.Shortcut
                >{/if}
            </CommandView.Item>
          {/each}
        </CommandView.Group>
      </CommandView.List>
    </CommandView.Root>
    <p class="approval-overrides">
      App and client restrictions still apply. Auto approval covers requested
      edits, commands and network access; it does not assess their safety.
    </p>
    {#if overrides.length}<p class="approval-overrides">
        Agent overrides: {overrides
          .map(
            (p) =>
              `${p.label} — ${APPROVAL_POLICIES.find((o) => o.value === p.approvalPolicy)?.label}`,
          )
          .join("; ")}. Edit the agent to change these.
      </p>{/if}
  </Popover.Content>
</Popover.Root>

<style>
  :global(.approval-policy-popover) {
    width: min(23rem, calc(100vw - 1rem));
    padding: 0.25rem;
  }
  .approval-overrides {
    margin: 0;
    padding: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  :global([data-testid="ai-chat-approval-policy"][data-auto-approve="true"]) {
    color: var(--primary);
  }
</style>
