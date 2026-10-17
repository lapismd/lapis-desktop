// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins panel assertions; see src/lib/ai/NOTICE.md.
import { expect, userEvent, waitFor, within } from "storybook/test";
import { readyPanel, inspectPanel } from "./panel-interactions.ts";
export async function historyAssertions(
  canvasElement: HTMLElement,
  prepared?: ReturnType<typeof within>,
) {
  const panel =
    prepared ?? (await readyPanel(canvasElement, "ai-conversation-history"));
  const panelElement = canvasElement.querySelector<HTMLElement>(
    '[data-testid="ai-conversation-history"]',
  );
  expect(panelElement).not.toBeNull();
  if (!panelElement) throw new Error("Missing production History panel");
  expect(panelElement).toHaveAttribute("data-current-scope", "Notes");
  expect(panelElement).toHaveAttribute("data-creation-scope", "Notes");
  const creationPath = panel.getByTestId("ai-history-creation-scope");
  expect(creationPath).toHaveTextContent("Notes");
  for (const button of panelElement.querySelectorAll(
    "button.ai-history__open",
  )) {
    expect(button).toHaveAccessibleName(
      button.textContent?.replace(/\s+/gu, " ").trim(),
    );
  }

  const tree = panel.getByRole("tree", { name: "Conversation history" });
  const activeFolder = panel.getByRole("treeitem", {
    name: "Notes, 1 conversation",
  });
  expect(activeFolder).toHaveAttribute("aria-selected", "true");
  expect(activeFolder).toHaveAttribute("aria-expanded", "true");
  expect(
    panel.getByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
  ).toBeVisible();
  expect(panel.queryByText("Archived planning chat")).toBeNull();
  expect(tree.querySelectorAll('[role="treeitem"]')).not.toHaveLength(0);

  const search = panel.getByRole("searchbox", {
    name: "Search conversations",
  });
  const chrome = panelElement?.querySelector<HTMLElement>(
    '[data-ui-part="chrome"]',
  );
  const searchPill = chrome?.querySelector<HTMLElement>(
    ".cv-search-filter-bar__search-pill",
  );
  const actions = chrome?.querySelector<HTMLElement>(
    ".cv-search-filter-bar__actions",
  );
  expect(chrome).not.toBeNull();
  expect(searchPill).not.toBeNull();
  expect(actions).not.toBeNull();
  const chromeBox = chrome!.getBoundingClientRect();
  const pillBox = searchPill!.getBoundingClientRect();
  const actionsBox = actions!.getBoundingClientRect();
  const clusterCenter =
    (Math.min(pillBox.left, actionsBox.left) +
      Math.max(pillBox.right, actionsBox.right)) /
    2;
  expect(
    Math.abs(clusterCenter - (chromeBox.left + chromeBox.right) / 2),
  ).toBeLessThan(8);

  await userEvent.type(search, "parser");
  await waitFor(() => {
    expect(
      panel.getByRole("button", { name: /^Fix parser errors(?:\s|$)/ }),
    ).toBeVisible();
    expect(
      panelElement?.querySelectorAll(".suggestion-highlight").length,
    ).toBeGreaterThan(0);
  });

  await userEvent.click(panel.getByRole("button", { name: "Clear search" }));
  await waitFor(() => {
    expect(
      panel.getByRole("button", { name: /^Summarize project notes(?:\s|$)/ }),
    ).toBeVisible();
  });

  await userEvent.click(
    panel.getByRole("button", { name: "Show conversation options" }),
  );
  const archivedSwitch = panel.getByRole("switch", {
    name: "Show archived conversations",
  });
  await userEvent.click(archivedSwitch);
  expect(archivedSwitch).toHaveAttribute("data-state", "checked");
  await waitFor(() => {
    expect(panel.getByText("Archived planning chat")).toBeVisible();
    expect(
      panel.getByRole("treeitem", { name: "Notes, 2 conversations" }),
    ).toBeVisible();
  });

  const newChat = panel.getByRole("button", { name: "New chat in Notes" });
  expect(newChat).toBeVisible();
  await userEvent.hover(newChat);
  await waitFor(() => {
    expect(
      canvasElement.ownerDocument.body.querySelector(
        '[data-slot="tooltip-content"]',
      ),
    ).toHaveTextContent("New chat in Notes");
  });
  await userEvent.unhover(newChat);
  await waitFor(() => {
    expect(
      canvasElement.ownerDocument.body.querySelector(
        '[data-slot="tooltip-content"]',
      ),
    ).toBeNull();
  });

  const expandAll = panel.getByRole("button", {
    name: "Expand all conversation folders",
  });
  await userEvent.hover(expandAll);
  await waitFor(() => {
    expect(
      canvasElement.ownerDocument.body.querySelector(
        '[data-slot="tooltip-content"]',
      ),
    ).toHaveTextContent("Expand all conversation folders");
  });
  await userEvent.unhover(expandAll);
  await waitFor(() => {
    expect(
      canvasElement.ownerDocument.body.querySelector(
        '[data-slot="tooltip-content"]',
      ),
    ).toBeNull();
  });

  await userEvent.click(expandAll);
  await waitFor(() => {
    expect(
      panel.getByRole("treeitem", {
        name: "Projects/Atlas, 1 conversation",
      }),
    ).toBeVisible();
  });
  const countRights = [
    ...panelElement.querySelectorAll<HTMLElement>(".ai-history__count"),
  ].map((count) => count.getBoundingClientRect().right);
  expect(countRights.length).toBeGreaterThan(1);
  expect(Math.max(...countRights) - Math.min(...countRights)).toBeLessThan(2);

  await userEvent.click(
    panel.getByRole("treeitem", { name: "Projects, 1 conversation" }),
  );
  await waitFor(() => {
    expect(panelElement).toHaveAttribute("data-creation-scope", "Projects");
    expect(creationPath).toHaveTextContent("Projects");
    expect(
      panel.getByRole("button", { name: "New chat in Projects" }),
    ).toBeVisible();
  });
}
