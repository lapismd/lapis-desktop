<script lang="ts">
  // Adapted from jj-store StoreIntegrations.svelte (Apache-2.0).
  import { onMount, tick, type Snippet } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Menu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import KeyRound from "@lucide/svelte/icons/key-round";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import RepositoryAuthorAvatar from "../RepositoryAuthorAvatar.svelte";
  import ForgeAuthorization from "./ForgeAuthorization.svelte";
  import ForgeIcon from "./ForgeIcon.svelte";
  import BackupCard from "./BackupCard.svelte";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { ForgeState } from "../../../lib/repository/forge-accounts.ts";
  let {
    controller,
    remoteSettings,
  }: { controller: ForgeController; remoteSettings?: Snippet } = $props();
  let snapshot = $state<ForgeState>({ busy: true, flow: "" });
  let menu = $state(false);
  onMount(() => {
    const unsubscribe = controller.subscribe((value) => (snapshot = value));
    void controller.refresh();
    return unsubscribe;
  });
  async function choose(method: "oauth" | "pat" | "enterprise" | "forgejo") {
    menu = false;
    await tick();
    if (method === "oauth") await controller.begin();
    else controller.tokenFlow(method);
  }
</script>

<section
  class="backup-settings"
  aria-label="Repository backup settings"
  aria-busy={snapshot.busy}
>
  <BackupCard
    title="GitHub and Forgejo"
    description="Connect an account for remote vault backup."
    padded={false}
  >
    {#snippet icon()}<ForgeIcon provider="github" />{/snippet}
    {#snippet actions()}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={snapshot.busy}
        aria-label="Refresh forge accounts"
        onclick={() => controller.refresh()}><RefreshCw /></Button
      >
    {/snippet}
    {#if !snapshot.inventory && snapshot.busy}<div
        class="account-row"
        role="status"
        aria-label="Loading forge accounts"
      >
        <Skeleton style="height:2.5rem;width:2.5rem" /><Skeleton
          style="height:1rem;width:60%"
        />
      </div>
    {:else if !snapshot.inventory}<Empty.Root
        ><Empty.Header
          ><Empty.Media variant="icon"><KeyRound /></Empty.Media><Empty.Title
            >Accounts unavailable</Empty.Title
          ><Empty.Description
            >Refresh to load your forge accounts.</Empty.Description
          ></Empty.Header
        ></Empty.Root
      >
    {:else}
      {#each snapshot.inventory.accounts as account (account.id)}<div
          class="account-row"
        >
          <RepositoryAuthorAvatar
            name={account.name || account.login}
            avatarUrl={account.avatar_url || undefined}
            email={account.email || ""}
            handle={account.login}
            size="md"
          />
          <div class="account-identity">
            <div>
              <ForgeIcon
                provider={account.api_url.includes("/api/v1")
                  ? "forgejo"
                  : "github"}
              /><strong>{account.login}</strong><Badge variant="secondary"
                >{account.method === "oauth"
                  ? "OAuth"
                  : account.method === "enterprise"
                    ? "Enterprise PAT"
                    : "PAT"}</Badge
              >
            </div>
            {#if account.email}<span>{account.email}</span>{/if}<span
              >{new URL(account.api_url).host} · {account.available
                ? "Connected"
                : "Reconnect required"}</span
            >
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={snapshot.busy || Boolean(snapshot.flow)}
            aria-label={`Forget ${account.login} ${account.method} account`}
            onclick={() => controller.forget(account.id)}
            >Forget<Trash2 data-icon="inline-end" /></Button
          >
        </div>{/each}
      {#if !snapshot.inventory.accounts.length}<p class="guidance">
          Connect an account to choose a remote backup repository.
        </p>{/if}
    {/if}
    {#snippet footer()}
      <span class="guidance"
        ><ForgeIcon provider="github" /><ForgeIcon provider="forgejo" />Forge
        account access</span
      >
      <Menu.Root bind:open={menu}
        ><Menu.Trigger
          >{#snippet child({ props })}<Button
              {...props}
              variant="outline"
              disabled={snapshot.busy || Boolean(snapshot.flow)}
              aria-label="Add forge account"
              >Add forge account<Plus data-icon="inline-end" /></Button
            >{/snippet}</Menu.Trigger
        >
        <Menu.Content
          align="end"
          style="width:max-content;min-width:14rem;max-width:calc(100dvw - 1rem);white-space:nowrap"
          ><Menu.Group>
            <Menu.Item
              disabled={!snapshot.inventory?.oauth_available}
              onSelect={() => void choose("oauth")}
              ><ForgeIcon provider="github" decorative />Authorize GitHub
              Account</Menu.Item
            >
            <Menu.Item onSelect={() => void choose("pat")}
              ><KeyRound />Add Personal Access Token</Menu.Item
            >
            <Menu.Item onSelect={() => void choose("enterprise")}
              ><ForgeIcon provider="github" decorative />Add GitHub Enterprise
              Account</Menu.Item
            >
            <Menu.Item onSelect={() => void choose("forgejo")}
              ><ForgeIcon provider="forgejo" decorative />Add Forgejo Account</Menu.Item
            >
          </Menu.Group></Menu.Content
        >
      </Menu.Root>
    {/snippet}
  </BackupCard>
  {#if snapshot.inventory && !snapshot.inventory.oauth_available}<p
      class="guidance"
    >
      Device sign-in uses the public OAuth client ID configured for jj-store.
      Configure that ID or connect with a personal token.
    </p>{/if}
  <ForgeAuthorization manager={controller} {snapshot} />
  {@render remoteSettings?.()}
  <p class="guidance">
    <KeyRound />Credentials are saved locally in your OS credential store.
  </p>
</section>

<style>
  .backup-settings {
    display: grid;
    gap: 1rem;
    min-width: 0;
    color: var(--foreground);
  }
  .account-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    min-width: 0;
  }
  .account-identity {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .account-identity > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .account-row + .account-row {
    border-top: 1px solid var(--border);
  }
  p.guidance {
    padding: 1rem;
  }
  .account-identity > span,
  .guidance {
    font-size: 0.8rem;
    color: var(--muted-foreground);
  }
  .guidance {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
  .guidance :global(svg) {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  @media (max-width: 40rem) {
    .account-row {
      flex-wrap: wrap;
    }
    .account-identity {
      min-width: 50%;
    }
  }
</style>
