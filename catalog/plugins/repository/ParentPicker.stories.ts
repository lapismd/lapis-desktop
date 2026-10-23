import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import RepositoryDemo from "../../support/repository/RepositoryDemo.svelte";
import { RepositoryPanel } from "@lapismd/repository-ui/jj";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { openHistory } from "../../support/repository/interactions.ts";
import { parent } from "../../support/repository/fixture.ts";
import { historyContext } from "../../support/repository/context.ts";

const meta: Meta = {
  title: "Desktop/Repository comparison picker",
  component: RepositoryPanel,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  render: (_args, { parameters }) => ({
    Component: RepositoryDemo,
    props: { scenario: parameters.scenario ?? "merge" },
  }),
};
export const UnloadedParentSearchAndTags: StoryObj = {
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const trigger = history.getByRole("combobox", {
      name: "Compare with parent",
    });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const search = await body.findByRole("combobox", {
      name: "Select comparison parent",
    });
    await userEvent.type(search, "grace@example.test");
    const option = await body.findByRole("row", {
      name: /Second recorded parent/,
    });
    await expect(
      within(option).getByRole("button", { name: /About Grace/ }),
    ).toBeVisible();
    await userEvent.hover(option);
    await expect(body.getByLabelText("Preview commit tags")).toHaveTextContent(
      "topic",
    );
    await expect(option.querySelector("time")).not.toBeNull();
    await expect(
      body.queryByRole("row", { name: /Start the vault/ }),
    ).toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, "no matching parent");
    await expect(await body.findByText("No matching commits")).toBeVisible();
    const dialog = within(
      body.getByRole("dialog", { name: "Choose comparison parent" }),
    );
    await expect(
      dialog.queryAllByRole("row", { name: /Select comparison parent/ }),
    ).toHaveLength(0);
    await userEvent.clear(search);
    const id = "33".repeat(20);
    await userEvent.type(search, id);
    await userEvent.keyboard("{ArrowDown}");
    await expect(body.getByLabelText("Preview commit tags")).toHaveTextContent(
      "topic",
    );
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("data-parent", id);
    await expect(
      await history.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
    await userEvent.click(trigger);
    const stats = body.getByLabelText("Selected comparison statistics");
    await expect(stats).toHaveTextContent("1 file in selected comparison");
    await expect(stats).not.toHaveTextContent("Selected file:");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(history.getByRole("button", { name: "Welcome.md" }));
    await userEvent.click(trigger);
    await expect(
      body.getByLabelText("Selected comparison statistics"),
    ).toHaveTextContent("Selected file: Welcome.md");
    await userEvent.click(
      body.getByRole("button", { name: "Close commit selector" }),
    );
  },
};
export const MetadataFailureAndExplicitRecovery: StoryObj = {
  parameters: { scenario: "parent-details-failure" },
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const trigger = history.getByRole("combobox", {
      name: "Compare with parent",
    });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("The parent details could not be read"),
    ).toBeVisible();
    const { fixture } = historyContext(canvasElement);
    const count = fixture.calls.length;
    await expect(trigger).toHaveValue("");
    await waitFor(() =>
      expect(body.getByRole("row", { name: /Unknown version/ })).toBeVisible(),
    );
    expect(fixture.calls.length).toBe(count);
    fixture.recover();
    await userEvent.click(
      body.getByRole("button", { name: "Retry parent details" }),
    );
    await expect(
      await body.findByRole("row", { name: /Second recorded parent/ }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        body.queryByText("The parent details could not be read"),
      ).toBeNull(),
    );
    await userEvent.click(
      body.getByRole("row", { name: /Second recorded parent/ }),
    );
    await expect(trigger).toHaveAttribute("data-parent", "33".repeat(20));
  },
};
export default meta;
export const ParentMetadataAndKeyboardSelection: StoryObj = {
  play: async ({ canvasElement }) => {
    const history = await openHistory(canvasElement);
    await userEvent.click(
      await history.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const trigger = history.getByRole("combobox", {
      name: "Compare with parent",
    });
    expect(trigger.tagName).toBe("BUTTON");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const search = await body.findByRole("combobox", {
      name: "Select comparison parent",
    });
    await expect(search).toHaveFocus();
    const command = search.closest(
      '[data-ui-component="command-view"][data-ui-part="root"]',
    );
    expect(command).not.toBeNull();
    await userEvent.type(search, "Start the vault");
    const option = await body.findByRole("row", { name: /Start the vault/ });
    await expect(
      within(option).getByRole("button", { name: /About Ada/ }),
    ).toBeVisible();
    await expect(option).toHaveTextContent("GIT");
    await expect(option).toHaveTextContent("JJ");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("data-parent", parent);
    await expect(
      await history.findByRole("button", { name: "Welcome.md" }),
    ).toBeVisible();
  },
};

export const MergeParentSelection: StoryObj = {
  parameters: { scenario: "merge" },
  play: async ({ canvasElement }) => {
    const canvas = await openHistory(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: /Keep repository history beside the notes/,
      }),
    );
    const base = canvas.getByRole("combobox", { name: "Compare with parent" });
    await expect(base).toHaveValue("");
    await expect(
      canvas.queryByRole("button", { name: "Welcome.md" }),
    ).toBeNull();
    await userEvent.click(base);
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("row", {
        name: /Start the vault/,
      }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Welcome.md" }),
    );
    await expect(
      await canvas.findByRole("region", { name: "Changes to Welcome.md" }),
    ).toHaveTextContent("History is retained");
  },
};
