// Adapted from Lapis Notes CORE027 (fa77eb1a); production shell and public APIs.
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { WorkspaceShell } from "@lapis-notes/workspace";
import type { App } from "@lapis-notes/api";
import EditingRecoveryDemo from "../../support/desktop/editing-recovery/EditingRecoveryDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta = {
  title: "Desktop/Editing recovery",
  component: WorkspaceShell,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      source: {
        language: "svelte",
        type: "code",
        code: `<script module lang="ts">
  import { App, type VaultSession } from '@lapis-notes/api';
  import { MarkdownPlugin } from '@lapis-notes/markdown';

  // The host admits this existing vault and supplies its adapter, database
  // and nativeEditingIntents. The disposable catalog seeds Note.md there.
  export async function loadWorkspace(session: VaultSession) {
    const app = new App({ version: '0.0.1', session });
    app.plugins.registerCorePlugins([
      { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    ]);
    await app.vault.load();
    await app.configuration.load();
    await app.plugins.loadPlugins({
      communityPlugins: 'disabled', optionalCorePlugins: 'configured',
    });
    await app.workspace.loadLayout();
    return app;
  }
  // Before unmounting/disposal, the host awaits
  // app.fileEditingSessions.preflightNativeRecovery();
  // A refused leave keeps this same App and its Problems actions mounted.
</script>
<script lang="ts">
  import { WorkspaceShell } from '@lapis-notes/workspace';
  let { app }: { app: App } = $props();
</script>
<WorkspaceShell {app} />`,
      },
    },
  },
} satisfies Meta<typeof WorkspaceShell>;
export default meta;
type Story = StoryObj<typeof EditingRecoveryDemo>;

async function ownedApp(canvasElement: HTMLElement) {
  let app!: App;
  await waitFor(() => {
    const frame = canvasElement.querySelector<HTMLElement>(
      '[data-editing-recovery-ready="true"]',
    );
    expect(
      frame?.querySelector('[data-app-shell-ready="true"]'),
    ).toBeInTheDocument();
    app = (frame as HTMLElement & { __lapisApp: App }).__lapisApp;
    expect(app).toBeDefined();
  });
  return app;
}

export const DetachedClaim: Story = {
  render: () => ({
    Component: EditingRecoveryDemo,
    props: { scenario: "detached" },
  }),
  parameters: {
    visualDelta: {
      images: [
        "catalog/plugins/desktop/editing-recovery/detached-claim-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "An unresolved claim appears in the existing Problems panel. Explicit recovery retains its dirty metadata; discard retires only the claim and preserves saved bytes.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const app = await ownedApp(canvasElement);
    const canvas = within(canvasElement);
    const message = await canvas.findByText(/Unresolved editing claim\./);
    await fireEvent.contextMenu(message);
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Review saved file",
      }),
    );
    await expect(
      await canvas.findByRole("heading", { name: "Saved note" }),
    ).toBeVisible();
    await fireEvent.contextMenu(canvas.getByText(/Unresolved editing claim\./));
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Recover editing claim",
      }),
    );
    await waitFor(() =>
      expect(
        app.fileEditingSessions.nativeRecovery?.snapshot().claims[0]?.detached,
      ).toBe(false),
    );
    await fireEvent.contextMenu(canvas.getByText(/Unresolved editing claim\./));
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Discard editing claim",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByText(/Unresolved editing claim\./),
      ).not.toBeInTheDocument(),
    );
    expect(await app.vault.adapter.read("Note.md")).toContain("# Saved note");
  },
};

export const AdmissionFailure: Story = {
  render: () => ({
    Component: EditingRecoveryDemo,
    props: { scenario: "admission" },
  }),
  parameters: {
    visualDelta: {
      images: [
        "catalog/plugins/desktop/editing-recovery/admission-failure-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "A local initial admission failure is visible even though no native claim exists. The existing Problems menu retries that captured registration without replaying an operation.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const app = await ownedApp(canvasElement);
    const canvas = within(canvasElement);
    const message = await canvas.findByText(/Editing admission failed:/);
    await fireEvent.contextMenu(message);
    await userEvent.click(
      await within(document.body).findByRole("menuitem", {
        name: "Retry editing admission",
      }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByText(/Editing admission failed:/),
      ).not.toBeInTheDocument(),
    );
    expect(app.fileEditingSessions.nativeIssues.entries).toEqual([]);
    expect(await app.vault.adapter.read("Note.md")).toContain("# Saved note");
  },
};
