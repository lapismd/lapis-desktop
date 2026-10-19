<script lang="ts">
  // Adapted from jj-store StoreIntegrations.svelte (Apache-2.0).
  import { onMount, tick, type Snippet } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as Menu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import KeyRound from "@lucide/svelte/icons/key-round";
  import Building2 from "@lucide/svelte/icons/building-2";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import RepositoryAuthorAvatar from "../RepositoryAuthorAvatar.svelte";
  import ForgeAuthorization from "./ForgeAuthorization.svelte";
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
  async function choose(method: "oauth" | "pat" | "enterprise") {
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
  <header>
    <h1>Backup settings</h1>
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={snapshot.busy}
      aria-label="Refresh forge accounts"
      onclick={() => controller.refresh()}><RefreshCw /></Button
    >
  </header>
  <ScrollArea.Root style="flex:1;min-height:0">
    <div class="backup-settings-body">
      <Card.Root>
        <Card.Header
          ><Card.Title>GitHub</Card.Title><Card.Description
            >Connect an account for remote vault backup.</Card.Description
          ></Card.Header
        >
        <Card.Content>
          {#if !snapshot.inventory && snapshot.busy}<div
              class="account-row"
              role="status"
              aria-label="Loading GitHub accounts"
            >
              <Skeleton style="height:2.5rem;width:2.5rem" /><Skeleton
                style="height:1rem;width:60%"
              />
            </div>
          {:else if !snapshot.inventory}<Empty.Root
              ><Empty.Header
                ><Empty.Media variant="icon"><KeyRound /></Empty.Media
                ><Empty.Title>Accounts unavailable</Empty.Title
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
                  email={account.email || ""}
                  handle={account.login}
                  size="md"
                />
                <div class="account-identity">
                  <div>
                    <strong>{account.login}</strong><Badge variant="secondary"
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
                Connect GitHub to choose a remote backup repository.
              </p>{/if}
          {/if}
        </Card.Content>
        <Card.Footer>
          <Menu.Root bind:open={menu}
            ><Menu.Trigger
              >{#snippet child({ props })}<Button
                  {...props}
                  variant="outline"
                  disabled={snapshot.busy || Boolean(snapshot.flow)}
                  aria-label="Add GitHub account"
                  >Add GitHub account<Plus data-icon="inline-end" /></Button
                >{/snippet}</Menu.Trigger
            >
            <Menu.Content align="end"
              ><Menu.Group>
                <Menu.Item
                  disabled={!snapshot.inventory?.oauth_available}
                  onSelect={() => void choose("oauth")}
                  ><KeyRound />Authorize GitHub Account</Menu.Item
                >
                <Menu.Item onSelect={() => void choose("pat")}
                  ><KeyRound />Add Personal Access Token</Menu.Item
                >
                <Menu.Item onSelect={() => void choose("enterprise")}
                  ><Building2 />Add GitHub Enterprise Account</Menu.Item
                >
              </Menu.Group></Menu.Content
            >
          </Menu.Root>
        </Card.Footer>
      </Card.Root>
      {#if snapshot.inventory && !snapshot.inventory.oauth_available}<p
          class="guidance"
        >
          Device sign-in uses the public OAuth client ID configured for
          jj-store. Configure that ID or connect with a personal token.
        </p>{/if}
      <ForgeAuthorization manager={controller} {snapshot} />
      {@render remoteSettings?.()}
      <p class="guidance">
        <KeyRound />Credentials are saved locally in your OS credential store.
      </p>
    </div>
  </ScrollArea.Root>
</section>

<style>
  .backup-settings {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--background);
    color: var(--foreground);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }
  h1 {
    font-size: 0.875rem;
    margin: 0;
    font-weight: 600;
  }
  .backup-settings-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    max-width: 56rem;
    margin: auto;
  }
  .account-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
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
