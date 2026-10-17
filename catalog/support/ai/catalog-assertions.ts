// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins panel assertions; see src/lib/ai/NOTICE.md.
import { expect, userEvent, waitFor } from "storybook/test";
import { readyPanel, inspectPanel } from "./panel-interactions.ts";
export async function catalogAssertions(canvasElement: HTMLElement) {
  const panel = await readyPanel(canvasElement, "ai-catalog");
  expect(panel.getByRole("tree", { name: "AI catalog" })).toBeVisible();
  expect(panel.getByRole("treeitem", { name: "Search" })).toBeVisible();
  expect(panel.getByRole("treeitem", { name: "AI" })).toBeVisible();
  expect(
    panel.getAllByRole("treeitem", { name: "Tools" }).length,
  ).toBeGreaterThan(0);
  expect(panel.getByText("/search")).toBeVisible();
  expect(panel.getByText("/help")).toBeVisible();
  expect(panel.getByText("lapis-notes")).toBeVisible();

  await userEvent.click(
    panel.getByRole("treeitem", { name: "notes_search read" }),
  );
  expect(panel.getByText(/Search the user's Lapis Notes/i)).toBeVisible();

  expect(panel.getByRole("button", { name: "Expand all" })).toBeVisible();

  const checkbox = panel.getByRole("checkbox", {
    name: "Enable notes_search for the next chat",
  });
  expect(checkbox).toHaveAttribute("data-state", "checked");
  await userEvent.click(checkbox);
  await waitFor(async () => {
    expect(
      (await inspectPanel(canvasElement)).settings.disabledAppToolNames,
    ).toContain("notes_search");
  });

  await userEvent.type(panel.getByLabelText("Filter catalog"), "daily");
  const daily = panel.getByRole("treeitem", { name: "daily" });
  await waitFor(() => {
    expect(getComputedStyle(daily).pointerEvents).not.toBe("none");
  });
  await userEvent.click(daily);
  await waitFor(() => {
    expect(panel.getByRole("button", { name: "Open daily" })).toBeVisible();
    expect(panel.queryByText("lapis-notes")).toBeNull();
  });

  await userEvent.click(panel.getByRole("button", { name: "Open daily" }));
  await waitFor(async () => {
    expect((await inspectPanel(canvasElement)).opened).toBe(
      "Notes/.agents/skills/daily/SKILL.md",
    );
  });
}
