<!-- Copied and adapted from jj-store StoreAgentRuntimes.svelte; Apache-2.0. -->
<script lang="ts">
  import ClientSettingsCard from "./ClientSettingsCard.svelte";
  import ClientSettingsFooter from "./ClientSettingsFooter.svelte";
  import { untrack } from "svelte";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
  import EllipsisVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
  import AgentClientSummary from "./AgentClientSummary.svelte";
  import ClientSettingsEmpty from "./ClientSettingsEmpty.svelte";
  import type {
    AgentClients,
    AgentClient as Runtime,
  } from "../../../lib/ai/settings/clients.svelte.ts";
  let {
    management,
    active = true,
  }: { management?: AgentClients; active?: boolean } = $props();
  let selected = $state<Runtime | null>(null);
  let confirm = $state(false);
  const actionLabel = $derived(
    selected?.action === "update" ? "Update" : "Install",
  );
  const value = $derived(management?.value);
  const blocked = $derived(
    !value?.install_supported ||
      Boolean(management?.pending || management?.saving || management?.error),
  );
  $effect(() => {
    if (!active || !management) return;
    const owner = management;
    untrack(() => owner.start());
    return () => owner.stop();
  });
  function request(runtime: Runtime) {
    selected = runtime;
    confirm = true;
  }
</script>

<svelte:window
  ononline={() => {
    if (active) void management?.refresh();
  }}
/>
<ClientSettingsCard
  id="agent-runtimes-title"
  title="Installed clients"
  description="Choose which agent tools Lapis can use on this device."
  Icon={DownloadIcon}
>
  {#if !management || !management.available()}
    <ClientSettingsEmpty
      Icon={DownloadIcon}
      title="Agent runtimes unavailable"
      description="Enable AI in a trusted desktop vault to manage clients on this device."
    />
  {:else}
    {#if value}
      <div class="store-settings__rows">
        <div class="store-runtime__list">
          {#each value.runtimes as runtime (runtime.id)}
            {@const status = management.error ? "unknown" : runtime.state}
            <ClientSettingsFooter>
              {#snippet description()}<AgentClientSummary
                  {runtime}
                  {status}
                />{/snippet}
              {#if runtime.action && runtime.state !== "ready"}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={blocked}
                  onclick={() => request(runtime)}
                  aria-label={`${runtime.action === "update" ? "Update" : "Install"} ${runtime.label} runtime`}
                >
                  <DownloadIcon data-icon="inline-start" />{runtime.action ===
                  "update"
                    ? "Update"
                    : "Install"}
                </Button>
              {:else if runtime.id === "cursor"}
                <a
                  data-ui-component="button"
                  data-slot="button"
                  data-variant="outline"
                  data-size="sm"
                  href={runtime.guide_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon
                    data-icon="inline-start"
                  />{runtime.cli_version ? "Setup guide" : "Install guide"}
                </a>
              {/if}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}<Button
                      {...props}
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${runtime.label} runtime options`}
                      ><EllipsisVerticalIcon /></Button
                    >{/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end"
                  ><DropdownMenu.Group>
                    <DropdownMenu.Item>
                      {#snippet child({ props })}<a
                          {...props}
                          href={runtime.guide_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          ><ExternalLinkIcon />Setup guide</a
                        >{/snippet}
                    </DropdownMenu.Item>
                  </DropdownMenu.Group></DropdownMenu.Content
                >
              </DropdownMenu.Root>
            </ClientSettingsFooter>
          {/each}
        </div>
      </div>
      {#if value.install_unavailable}<p class="store-settings__row-description">
          {value.install_unavailable}
        </p>{/if}
      {#if !value.npm_available || !value.node_version || Number(value.node_version.split(".")[0]) < 22}
        <a
          data-ui-component="button"
          data-slot="button"
          data-variant="outline"
          data-size="sm"
          href="https://nodejs.org/en/download"
          target="_blank"
          rel="noopener noreferrer"
          ><ExternalLinkIcon data-icon="inline-start" />Install Node.js</a
        >
      {/if}
      {#if management.pending}
        <div role="status" class="store-runtime__pending">
          <p>
            {"Installing Codex tooling. You can leave this page; the original request is retained."}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={management.refreshing}
            onclick={() => void management?.refresh()}
            >Check installation</Button
          >
        </div>
      {/if}
    {:else if management.error}
      <ClientSettingsEmpty
        Icon={DownloadIcon}
        title="Runtime status unavailable"
        description="Check again to retrieve the tooling installed on this device."
      />
    {:else}
      <div
        class="store-settings__rows"
        role="status"
        aria-label="Loading agent runtimes"
        aria-busy="true"
      >
        <div aria-hidden="true" class="store-runtime__list">
          {#each [0, 1, 2] as row (row)}<ClientSettingsFooter>
              {#snippet description()}
                <div class="store-runtime__summary">
                  <Skeleton class="client-skeleton-avatar" />
                  <div class="store-runtime__copy">
                    <Skeleton class="client-skeleton-title" />
                    <Skeleton class="client-skeleton-detail" />
                  </div>
                </div>
              {/snippet}
              <span aria-hidden="true"
                ><Skeleton class="client-skeleton-button" /></span
              >
            </ClientSettingsFooter>{/each}
        </div>
      </div>
    {/if}
    <ClientSettingsFooter footer>
      {#if management?.available()}<Button
          variant="outline"
          size="sm"
          onclick={() => void management?.refresh()}
          disabled={management.refreshing}
        >
          <RefreshCwIcon data-icon="inline-start" />Check again
        </Button>
      {/if}
    </ClientSettingsFooter>
    <Dialog.Root bind:open={confirm}>
      <Dialog.Content>
        <Dialog.Header
          ><Dialog.Title>{actionLabel} Codex runtime?</Dialog.Title>
          <Dialog.Description
            >Download Codex ACP {selected?.target_version} and Codex CLI {selected?.target_cli_version}
            into Lapis's private device tooling directory. Existing global tools
            and chats are preserved. This does not authenticate or connect an agent.</Dialog.Description
          >
        </Dialog.Header>
        <Dialog.Footer
          ><Button variant="outline" onclick={() => (confirm = false)}
            >Cancel</Button
          >
          <Button
            disabled={blocked}
            onclick={() => {
              confirm = false;
              if (selected) void management?.install(selected);
            }}
            ><DownloadIcon data-icon="inline-start" />{actionLabel} runtime</Button
          >
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/if}
</ClientSettingsCard>
