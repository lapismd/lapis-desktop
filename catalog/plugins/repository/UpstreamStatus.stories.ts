import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import UpstreamDemo from "../../support/repository/UpstreamDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { notesReady } from "../../support/notes/readiness.ts";
const meta = {
  title: "Desktop/Repository upstream status",
  component: UpstreamDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof UpstreamDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(element: HTMLElement) {
  await notesReady(element);
  const canvas = within(element),
    page = within(element.ownerDocument.body);
  const trigger = await canvas.findByRole("button", {
    name: "Vault history: Saved locally",
  });
  await userEvent.click(trigger);
  const card = await page.findByRole("region", {
    name: "Vault history details",
  });
  return {
    canvas,
    page,
    card,
    controls: within(card),
    fixture: element.querySelector<HTMLElement>("[data-repository-fixture]")!,
  };
}
export const HeaderReview: Story = {
  play: async ({ canvasElement }) => {
    const { controls, fixture } = await open(canvasElement);
    expect(
      controls.getByRole("button", { name: /^Pull from upstream/ }),
    ).toHaveTextContent("2");
    expect(
      controls.getByRole("button", { name: /^Push to upstream/ }),
    ).toHaveTextContent("1");
    expect(fixture.dataset.actions).toBeUndefined();
  },
};
export const IncomingAndOutgoing: Story = {
  play: async ({ canvasElement }) => {
    const { controls, card, page, fixture } = await open(canvasElement);
    const fetch = controls.getByRole("button", { name: "Fetch from upstream" });
    const pull = controls.getByRole("button", { name: /^Pull from upstream/ });
    const push = controls.getByRole("button", { name: /^Push to upstream/ });
    await waitFor(() => expect(fetch).toBeEnabled());
    expect(pull).toHaveTextContent("2");
    expect(push).toHaveTextContent("1");
    expect(
      fetch.compareDocumentPosition(pull) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      pull.compareDocumentPosition(push) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const header = card.querySelector("header")!.getBoundingClientRect();
    expect(push.getBoundingClientRect().right).toBeGreaterThan(
      header.right - 30,
    );
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    for (const [button, title] of [
      [fetch, "Fetch from upstream"],
      [pull, "Pull from upstream"],
      [push, "Push to upstream"],
    ] as const) {
      expect(button).toHaveFocus();
      await waitFor(() =>
        expect(page.getByRole("tooltip")).toHaveTextContent(title),
      );
      await userEvent.tab();
    }
    await userEvent.click(fetch);
    await waitFor(() => expect(fixture.dataset.actions).toBe("fetch"));
    await waitFor(() => expect(pull).toBeEnabled());
    await userEvent.click(pull);
    await waitFor(() =>
      expect(fixture.dataset.actions).toBe("fetch|pull|apply"),
    );
    await waitFor(() => expect(push).toBeEnabled());
    expect(pull).toHaveTextContent("0");
    await userEvent.click(push);
    await waitFor(() =>
      expect(fixture.dataset.actions).toBe(
        "fetch|pull|apply|capture|push|fetch",
      ),
    );
    await waitFor(() => expect(push).toBeEnabled());
    expect(push).toHaveTextContent("0");
  },
};
export const AwaitingFirstFetch: Story = {
  args: { scenario: "unfetched" },
  play: async ({ canvasElement }) => {
    const { controls } = await open(canvasElement);
    const fetch = controls.getByRole("button", { name: "Fetch from upstream" });
    await waitFor(() => expect(fetch).toBeEnabled());
    expect(
      controls.getByRole("button", { name: /^Pull from upstream/ }),
    ).toHaveTextContent("—");
    await userEvent.click(fetch);
    await waitFor(() =>
      expect(
        controls.getByRole("button", { name: /^Pull from upstream/ }),
      ).toHaveTextContent("2"),
    );
  },
};
export const NoUpstream: Story = {
  args: { scenario: "disconnected" },
  play: async ({ canvasElement }) => {
    const { controls, page } = await open(canvasElement);
    for (const label of [
      "Fetch from upstream",
      "Pull from upstream",
      "Push to upstream",
    ]) {
      const button = controls.getByRole("button", {
        name: new RegExp(`^${label}`),
      });
      expect(button).toBeDisabled();
      await userEvent.hover(button.parentElement!);
      await waitFor(() =>
        expect(page.getByRole("tooltip")).toHaveTextContent(label),
      );
      await userEvent.unhover(button.parentElement!);
    }
  },
};
export const ReadOnly: Story = {
  args: { scenario: "read-only" },
  play: async ({ canvasElement }) => {
    const { controls } = await open(canvasElement);
    await waitFor(() =>
      expect(
        controls.getByRole("button", { name: "Fetch from upstream" }),
      ).toBeEnabled(),
    );
    expect(
      controls.getByRole("button", { name: /^Push to upstream/ }),
    ).toBeDisabled();
  },
};
export const PendingFetch: Story = {
  args: { scenario: "pending" },
  play: async ({ canvasElement }) => {
    const { controls, canvas, fixture } = await open(canvasElement);
    const fetch = controls.getByRole("button", { name: "Fetch from upstream" });
    await waitFor(() => expect(fetch).toBeEnabled());
    await userEvent.click(fetch);
    for (const label of [
      "Fetch from upstream",
      "Pull from upstream",
      "Push to upstream",
    ])
      expect(
        controls.getByRole("button", { name: new RegExp(`^${label}`) }),
      ).toBeDisabled();
    expect(fixture.dataset.actions).toBe("fetch");
    await userEvent.click(
      canvas.getByRole("button", { name: "Finish upstream fetch" }),
    );
    await waitFor(() => expect(fetch).toBeEnabled());
  },
};
export const Offline: Story = {
  args: { scenario: "failed" },
  play: async ({ canvasElement }) => {
    const { controls, page } = await open(canvasElement);
    const fetch = controls.getByRole("button", { name: "Fetch from upstream" });
    await waitFor(() => expect(fetch).toBeEnabled());
    await userEvent.click(fetch);
    await expect(
      page.findByText("Upstream is offline; local history is safe"),
    ).resolves.toBeVisible();
  },
};
