import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ForgeDemo from "../../support/repository/ForgeDemo.svelte";
import { historyContext } from "../../support/repository/context.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
const meta: Meta = {
  title: "Desktop/Repository backup accounts",
  component: ForgeDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
};
export default meta;
async function open(element: HTMLElement) {
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30000 },
  );
  const host = getWorkspaceHostBinding(
    historyContext(element).app.workspace,
  ).controller;
  host.settings.open({ sectionId: "repository-history" });
  const body = within(element.ownerDocument.body);
  const configure = await within(element).findByRole("button", {
    name: "Forge accounts and remote backup",
  });
  await waitFor(() =>
    expect(getComputedStyle(configure).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(configure);
  const region = within(
    await within(element).findByRole("region", {
      name: "Repository backup settings",
    }),
  );
  return { body, region };
}
async function choose(element: HTMLElement, name: string) {
  const { body, region } = await open(element);
  const button = await region.findByRole("button", {
    name: "Add forge account",
  });
  await waitFor(() =>
    expect(getComputedStyle(button).pointerEvents).not.toBe("none"),
  );
  await userEvent.click(button);
  await userEvent.click(await body.findByRole("menuitem", { name }));
  return { body, region };
}
export const EmptyAccounts: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await expect(
      await region.findByText(
        "Connect an account to choose a remote backup repository.",
      ),
    ).toBeVisible();
  },
};
export const TokenAccount: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region } = await choose(canvasElement, "Add Personal Access Token");
    const token = await region.findByLabelText("Personal Access Token");
    await waitFor(() =>
      expect(getComputedStyle(token).pointerEvents).not.toBe("none"),
    );
    await userEvent.type(token, "synthetic-story-token");
    await userEvent.click(region.getByRole("button", { name: "Add account" }));
    await expect(await region.findByText("lapis-fixture")).toBeVisible();
    await expect(
      region.queryByLabelText("Personal Access Token"),
    ).not.toBeInTheDocument();
  },
};
export const DeviceAuthorization: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region } = await choose(canvasElement, "Authorize GitHub Account");
    await expect(await region.findByText("ABCD-1234")).toBeVisible();
    const activate = region.getByRole("button", {
      name: "Open GitHub activation page",
    });
    await waitFor(() =>
      expect(getComputedStyle(activate).pointerEvents).not.toBe("none"),
    );
    await userEvent.click(activate);
    await expect(
      canvasElement.querySelector("[data-activation-url]"),
    ).toHaveAttribute("data-activation-url", "https://github.com/login/device");
  },
};
export const FailureAndRecovery: StoryObj = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { body, region } = await open(canvasElement);
    await expect(
      await body.findByText("Credential service unavailable"),
    ).toBeVisible();
    await userEvent.click(
      region.getByRole("button", { name: "Refresh forge accounts" }),
    );
    await expect(
      await region.findByText(
        "Connect an account to choose a remote backup repository.",
      ),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("Credential service unavailable"),
      ).not.toBeInTheDocument(),
    );
  },
};
export const Loading: StoryObj = {
  args: { scenario: "loading" },
  play: async ({ canvasElement }) => {
    const { region } = await open(canvasElement);
    await expect(
      region.getByRole("status", { name: "Loading forge accounts" }),
    ).toBeVisible();
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "Finish account loading",
      }),
    );
    await expect(
      await region.findByText(
        "Connect an account to choose a remote backup repository.",
      ),
    ).toBeVisible();
  },
};

export const ForgejoToken: StoryObj = {
  play: async ({ canvasElement }) => {
    const { region } = await choose(canvasElement, "Add Forgejo Account");
    const api = await region.findByLabelText("API Base URL");
    await waitFor(() =>
      expect(getComputedStyle(api).pointerEvents).not.toBe("none"),
    );
    await userEvent.type(api, "https://forge.example/api/v1");
    await userEvent.type(
      region.getByLabelText("Personal Access Token"),
      "synthetic-forgejo-story",
    );
    await userEvent.click(region.getByRole("button", { name: "Add account" }));
    await expect(await region.findByText("lapis-fixture")).toBeVisible();
    await expect(
      canvasElement.querySelector("[data-forge-kind]"),
    ).toHaveAttribute("data-forge-kind", "add_forgejo_token");
    await expect(
      region.queryByLabelText("Personal Access Token"),
    ).not.toBeInTheDocument();
    await expect(region.getByText(/forge.example/)).toBeVisible();
  },
};
