<script lang="ts">
  // Adapted from jj-store StoreIntegrationAuth.svelte (Apache-2.0).
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import * as InputGroup from "@lapismd/design-core/shadcn/input-group";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Separator } from "@lapismd/design-core/shadcn/separator";
  import Copy from "@lucide/svelte/icons/copy";
  import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
  import X from "@lucide/svelte/icons/x";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import * as Card from "@lapismd/design-core/shadcn/card";

  import BackupField from "./BackupField.svelte";
  import type { ForgeController } from "../../../lib/repository/forge-controller.ts";
  import type { ForgeState } from "../../../lib/repository/forge-accounts.ts";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  let {
    manager,
    snapshot,
  }: { manager: ForgeController; snapshot: ForgeState } = $props();
  let token = $state("");
  let api = $state("");
  let visible = $state(false);
  const flow = $derived(snapshot.flow);
  $effect(() => {
    flow;
    visible = false;
    token = "";
    api = "";
  });
  const id = $props.id();
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        snapshot.inventory?.authorization?.user_code ?? "",
      );
    } catch {
      manager.feedback.report(
        new Error("Could not copy the verification code."),
      );
    }
  }
</script>

{#if snapshot.flow}
  <Card.Root>
    <Card.Header>
      <Card.Title
        >{snapshot.flow === "oauth"
          ? "Authorize GitHub Account"
          : snapshot.flow === "forgejo"
            ? "Add Forgejo Account"
            : snapshot.flow === "enterprise"
              ? "Add GitHub Enterprise Account"
              : "Add Personal Access Token"}</Card.Title
      >
      <Card.Action
        ><Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel authorization"
          disabled={snapshot.busy && snapshot.flow !== "oauth"}
          onclick={() => manager.cancel()}><X /></Button
        ></Card.Action
      >
    </Card.Header>
    <Card.Content>
      {#if snapshot.flow === "oauth"}
        {@const auth = snapshot.inventory?.authorization}
        {#if auth}
          <div class="integration-auth__device">
            <ol class="integration-auth__steps">
              <li>
                <p>Copy the following verification code:</p>
                <div class="integration-auth__code">
                  <strong>{auth.user_code}</strong><Button
                    variant="outline"
                    size="sm"
                    onclick={copy}
                    >Copy to Clipboard<Copy data-icon="inline-end" /></Button
                  >
                </div>
              </li>
              <li>
                <Separator />
                <p>
                  Navigate to the GitHub activation page and paste the code you
                  copied.
                </p>
                <Button onclick={() => manager.openAuthorization()}
                  >Open GitHub activation page<ArrowUpRight
                    data-icon="inline-end"
                  /></Button
                >
              </li>
            </ol>
            <p
              class="integration-auth__waiting"
              role="status"
              aria-live="polite"
            >
              {auth.state === "pending"
                ? "Waiting for GitHub authorization…"
                : `Authorization ${auth.state}`}
            </p>
          </div>
        {:else if snapshot.busy}<div
            class="integration-auth__device"
            role="status"
            aria-label="Requesting GitHub verification code"
          >
            <Skeleton style="height:2rem;width:14rem" /><Skeleton
              style="height:1rem;width:75%"
            />
          </div>
        {:else}<div class="integration-auth__device">
            <p>Authorization is unavailable. Start again to request a code.</p>
            <Button variant="outline" onclick={() => manager.begin()}
              >Try GitHub sign-in</Button
            >
          </div>{/if}
      {:else}
        <form
          onsubmit={(event) => {
            event.preventDefault();
            void manager
              .addToken(
                snapshot.flow === "pat" ? "https://api.github.com" : api,
                token,
              )
              .then((saved) => {
                if (saved) {
                  token = "";
                  api = "";
                }
              });
          }}
        >
          <Field.Group>
            {#if snapshot.flow === "enterprise" || snapshot.flow === "forgejo"}<BackupField
                label="API Base URL"
                id={`${id}-api`}
                description={snapshot.flow === "forgejo"
                  ? "For example, https://forge.example/api/v1"
                  : "For example, https://github.example.com/api/v3"}
              >
                <Input
                  id={`${id}-api`}
                  type="url"
                  required
                  bind:value={api}
                  disabled={snapshot.busy}
                  placeholder={snapshot.flow === "forgejo"
                    ? "https://forge.example/api/v1"
                    : "https://github.example.com/api/v3"}
                />
              </BackupField>{/if}
            <BackupField
              label="Personal Access Token"
              id={`${id}-token`}
              description="Saved in your OS Keychain / Credential Manager."
            >
              <InputGroup.Root>
                <InputGroup.Input
                  id={`${id}-token`}
                  type={visible ? "text" : "password"}
                  autocomplete="off"
                  required
                  bind:value={token}
                  disabled={snapshot.busy}
                />
                <InputGroup.Addon align="inline-end"
                  ><InputGroup.Button
                    aria-label={visible ? "Hide token" : "Show token"}
                    onclick={() => (visible = !visible)}
                    >{#if visible}<EyeOff />{:else}<Eye
                      />{/if}</InputGroup.Button
                  ></InputGroup.Addon
                >
              </InputGroup.Root>
            </BackupField>
          </Field.Group>
          <div class="auth-actions">
            <Button
              variant="outline"
              type="button"
              disabled={snapshot.busy}
              onclick={() => manager.cancel()}>Cancel</Button
            >
            <Button
              type="submit"
              disabled={snapshot.busy ||
                !token.trim() ||
                (snapshot.flow === "enterprise" && !api)}
            >
              {snapshot.busy ? "Connecting…" : "Add account"}</Button
            >
          </div>
        </form>
      {/if}
    </Card.Content>
  </Card.Root>
{/if}

<style>
  .auth-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-block-start: 1rem;
  }
  .integration-auth__device {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .integration-auth__device p {
    margin: 0;
  }
  .integration-auth__steps {
    margin: 0;
    padding: 0 0 0 1.75rem;
    list-style: none;
    border-inline-start: 1px dashed var(--border);
  }
  .integration-auth__steps li {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding-block: 0.25rem 1rem;
  }
  .integration-auth__steps li::before {
    content: "";
    position: absolute;
    inset-inline-start: -2.05rem;
    top: 0.65rem;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--muted-foreground);
    box-shadow: 0 0 0 4px var(--background);
  }
  .integration-auth__steps li :global([data-ui-component="separator"]) {
    align-self: stretch;
    margin-block-end: 0.5rem;
  }
  .integration-auth__steps li:last-child::before {
    top: 2.2rem;
  }
  .integration-auth__code {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.4rem;
    padding-inline-start: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .integration-auth__code strong {
    font-size: 1.35rem;
    letter-spacing: 0.08em;
  }
  .integration-auth__waiting {
    color: var(--muted-foreground);
    font-size: 0.8rem;
    padding-inline-start: 1.75rem;
  }
</style>
