<script lang="ts">
  import { untrack } from "svelte";
  import NotesDemo from "../NotesDemo.svelte";
  import { operationFixture } from "./operations.ts";
  import { bindHistoryFixture } from "./context.ts";
  import type { ForgeInventory } from "../../../src/lib/repository/forge-accounts.ts";
  let { scenario = "empty" }: { scenario?: "empty" | "failed" | "loading" } =
    $props();
  const fixture = untrack(() => operationFixture());
  let root: HTMLDivElement;
  let release: (() => void) | undefined;
  let reads = 0;
  let connected = false;
  let api = "https://api.github.com";
  const inventory = (): ForgeInventory => ({
    accounts: connected
      ? [
          {
            id: "account-42",
            api_url: api,
            login: "lapis-fixture",
            name: "Lapis fixture",
            email: "dev@lapis.md",
            avatar_url: null,
            method: "pat",
            available: true,
          },
        ]
      : [],
    oauth_available: true,
    keychain_supported: true,
    authorization: null,
  });
</script>

<div bind:this={root} data-repository-fixture class="forge-demo">
  {#if scenario === "loading"}<button onclick={() => release?.()}
      >Finish account loading</button
    >{/if}
  <NotesDemo
    createRepository={(app) => {
      bindHistoryFixture(root, { app, fixture });
      return {
        reader: fixture.reader,
        forges: {
          async inventory() {
            if (scenario === "failed" && reads++ === 0)
              throw new Error("Credential service unavailable");
            if (scenario === "loading")
              await new Promise<void>((resolve) => (release = resolve));
            return inventory();
          },
          async command(command) {
            if (
              command.kind === "add_token" ||
              command.kind === "add_forgejo_token"
            ) {
              api = command.api_url;
              root.dataset.forgeKind = command.kind;
              connected = true;
              root.dataset.connected = "true";
            }
            if (command.kind === "forget") connected = false;
            if (command.kind === "begin_oauth" || command.kind === "poll_oauth")
              return {
                ...inventory(),
                authorization: {
                  session: "opaque-fixture",
                  user_code: "ABCD-1234",
                  verification_uri: "https://github.com/login/device",
                  interval: 60,
                  expires_at: Date.now() / 1000 + 900,
                  state: "pending",
                },
              };
            return inventory();
          },
          async openAuthorization(url) {
            root.dataset.activationUrl = url;
          },
        },
        async close() {
          release?.();
          await fixture.close();
        },
      };
    }}
  />
</div>

<style>
  .forge-demo {
    height: 100vh;
    min-height: 36rem;
  }
</style>
