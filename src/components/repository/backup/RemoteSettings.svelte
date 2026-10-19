<script lang="ts">
  // Adapted from jj-store StoreForgeRepositoryAccess.svelte (Apache-2.0).
  import { onMount } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import * as Card from "@lapismd/design-core/shadcn/card";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import CloudDownload from "@lucide/svelte/icons/cloud-download";
  import KeyRound from "@lucide/svelte/icons/key-round";
  import History from "@lucide/svelte/icons/history";
  import PublicationRecovery from "./PublicationRecovery.svelte";
  import BackupField from "./BackupField.svelte";
  import BackupSelect from "./BackupSelect.svelte";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { ForgeState } from "../../../lib/repository/forge-accounts.ts";
  import type { RemoteController } from "../../../lib/repository/remote-controller.ts";
  import type { RemoteViewState } from "../../../lib/repository/remote.ts";
  import type { RestoreController } from "../../../lib/repository/restore.ts";
  let {
    controller,
    accounts,
    restore,
  }: {
    controller: RemoteController;
    accounts: ForgeController;
    restore?: RestoreController;
  } = $props();
  let snapshot = $state<RemoteViewState>({ busy: true, phase: "loading" });
  let inventory = $state<ForgeState>({ busy: true, flow: "" });
  let account = $state("");
  let project = $state("");
  let branch = $state("");
  let initialized = false;
  const id = $props.id();
  const available = $derived(
    inventory.inventory?.accounts.filter((value) => value.available) ?? [],
  );
  $effect(() => {
    if (!available.some((value) => value.id === account))
      account = available.length === 1 ? available[0].id : "";
  });
  onMount(() => {
    const stopRemote = controller.subscribe((value) => {
      snapshot = value;
      if (!initialized && value.data) {
        initialized = true;
        const config = value.data.configuration;
        if (config) {
          account = config.account;
          project = config.project;
          branch = config.target.branch;
        }
      }
    });
    const stopAccounts = accounts.subscribe((value) => (inventory = value));
    void controller.refresh();
    return () => {
      stopRemote();
      stopAccounts();
    };
  });
  async function connect() {
    if (await controller.configure(account, project, branch)) {
      const config = snapshot.data?.configuration;
      if (config) {
        account = config.account;
        project = config.project;
        branch = config.target.branch;
      }
    }
  }
</script>

<section aria-label="Remote vault backup" aria-busy={snapshot.busy}>
  <Card.Root>
    <Card.Header>
      <Card.Title>Remote backup</Card.Title>
      <Card.Description
        >{snapshot.data?.configuration
          ? `${snapshot.data.configuration.project} · ${snapshot.data.configuration.target.branch}`
          : "Connect a GitHub repository to back up or restore this vault."}</Card.Description
      >
      <Card.Action
        ><Button
          variant="ghost"
          size="icon-sm"
          disabled={snapshot.busy}
          aria-label="Refresh remote settings"
          onclick={() => controller.refresh()}><RefreshCw /></Button
        ></Card.Action
      >
    </Card.Header>
    <Card.Content>
      {#if !snapshot.data && snapshot.busy}
        <div
          class="remote-loading"
          role="status"
          aria-label="Loading remote backup"
        >
          <Skeleton style="height:1rem;width:30%" /><Skeleton
            style="height:2.25rem;width:100%"
          />
          <Skeleton style="height:1rem;width:40%" /><Skeleton
            style="height:2.25rem;width:100%"
          />
        </div>
      {:else if !snapshot.data}
        <Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"><CloudDownload /></Empty.Media
            ><Empty.Title>Remote settings unavailable</Empty.Title
            ><Empty.Description
              >Refresh to read your saved connection.</Empty.Description
            ></Empty.Header
          ></Empty.Root
        >
      {:else if !available.length}
        <Empty.Root
          ><Empty.Header
            ><Empty.Media variant="icon"><KeyRound /></Empty.Media><Empty.Title
              >{snapshot.data.configuration
                ? "Reconnect to fetch updates"
                : "Connect an account first"}</Empty.Title
            ><Empty.Description
              >{snapshot.data.configuration
                ? "Your cached backup remains available. Reconnect an account above to fetch more history."
                : "Add a GitHub account above to choose a remote backup repository."}</Empty.Description
            ></Empty.Header
          >
          {#if snapshot.data.configuration}<Empty.Content
              ><Button
                variant="outline"
                disabled={snapshot.busy}
                onclick={() => controller.disconnect()}
                >Disconnect remote</Button
              ></Empty.Content
            >{/if}
          {#if snapshot.data.checkpoint && restore}<Empty.Content
              ><Button
                variant="outline"
                disabled={snapshot.busy}
                onclick={() =>
                  restore?.prepareVault(snapshot.data!.checkpoint!.commit)}
                ><History data-icon="inline-start" />Review restore</Button
              ></Empty.Content
            >{/if}
        </Empty.Root>
      {:else}
        <form
          onsubmit={(event) => {
            event.preventDefault();
            void connect();
          }}
        >
          <Field.Group>
            <BackupField label="GitHub account" id={`${id}-account`}>
              <BackupSelect
                id={`${id}-account`}
                aria-label="GitHub account"
                bind:value={account}
                disabled={snapshot.busy}
                options={available.map((value) => ({
                  value: value.id,
                  label: `${value.login} · ${new URL(value.api_url).host}`,
                }))}
              />
            </BackupField>
            <BackupField
              label="GitHub repository"
              id={`${id}-project`}
              description="Use an existing repository in owner/repository form."
            >
              <Input
                id={`${id}-project`}
                bind:value={project}
                required
                placeholder="owner/notes"
                disabled={snapshot.busy}
              />
            </BackupField>
            <BackupField
              label="Backup branch"
              id={`${id}-branch`}
              description="Leave empty to use the repository's default branch."
            >
              <Input
                id={`${id}-branch`}
                bind:value={branch}
                placeholder="Repository default"
                disabled={snapshot.busy}
              />
            </BackupField>
          </Field.Group>
          <div class="remote-actions">
            <Button
              type="submit"
              disabled={snapshot.busy || !account || !project.trim()}
              >{snapshot.data.configuration
                ? "Save connection"
                : "Connect repository"}</Button
            >
            {#if snapshot.data.configuration}<Button
                type="button"
                variant="outline"
                disabled={snapshot.busy}
                onclick={() => controller.disconnect()}>Disconnect</Button
              >{/if}
          </div>
        </form>
        {#if snapshot.data.configuration}
          <div class="remote-history">
            {#if !snapshot.data.configuration.canPush}<Badge variant="secondary"
                >Read-only access</Badge
              >{/if}
            <p>
              Fetch remote history without changing local files. Review a
              checkpoint to restore it safely, including into a new empty vault.
            </p>
            <div class="remote-actions">
              <Button
                variant="outline"
                disabled={snapshot.busy ||
                  !available.some(
                    (value) =>
                      value.id === snapshot.data?.configuration?.account,
                  )}
                onclick={() => controller.fetch()}
                ><CloudDownload data-icon="inline-start" />Fetch remote history</Button
              >
              {#if snapshot.data.checkpoint && restore}<Button
                  variant="outline"
                  disabled={snapshot.busy}
                  onclick={() =>
                    restore?.prepareVault(snapshot.data!.checkpoint!.commit)}
                  ><History data-icon="inline-start" />Review restore</Button
                >{/if}
            </div>
            {#if snapshot.data.checkpoint}<p
                class="checkpoint"
                title={snapshot.data.checkpoint.description}
              >
                Latest remote checkpoint: {snapshot.data.checkpoint.description.split(
                  "\n",
                )[0] || "Untitled checkpoint"}
              </p>{/if}
          </div>
        {/if}
      {/if}
      {#if snapshot.data?.publication && controller.service.publication}<PublicationRecovery
          pending={snapshot.data.publication}
          busy={snapshot.busy}
          canObserve={available.some(
            (value) => value.id === snapshot.data?.configuration?.account,
          )}
          onObserve={(id) => controller.observePublication(id)}
          onStop={(id) => controller.stopPublication(id)}
        />{/if}
    </Card.Content>
  </Card.Root>
</section>

<style>
  .remote-loading {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .remote-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .remote-history {
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  p {
    font-size: 0.8rem;
    color: var(--muted-foreground);
    margin: 0.5rem 0;
  }
  .checkpoint {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
