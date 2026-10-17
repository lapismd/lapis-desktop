// SPDX-License-Identifier: Apache-2.0
import { expect, userEvent, waitFor, within } from "storybook/test";
export async function hoverHarnessControl(element: HTMLElement) {
  let coords = { clientX: 0, clientY: 0 };
  await waitFor(() => {
    expect(element).toBeVisible();
    // Match browser pointer actionability: an entering ancestor menu can
    // still move the option after it becomes visible to a role query.
    for (
      let ancestor: HTMLElement | null = element;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      expect(
        ancestor
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ).toBe(false);
    }
    const rect = element.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
    coords = {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };
    expect(
      element.contains(
        element.ownerDocument.elementFromPoint(coords.clientX, coords.clientY),
      ),
    ).toBe(true);
  });
  // The menu's pointer corridor hit-tests coordinates against the real DOM.
  // userEvent.hover/click otherwise keep synthetic (0, 0) or stale coordinates.
  await userEvent.pointer({ target: element, coords });
  return coords;
}

export async function clickHarnessControl(element: HTMLElement) {
  const coords = await hoverHarnessControl(element);
  let pointerDown: PointerEvent | undefined;
  element.addEventListener(
    "pointerdown",
    (event) => {
      pointerDown = event;
    },
    { once: true },
  );
  await userEvent.pointer({ target: element, coords, keys: "[MouseLeft]" });
  expect(
    pointerDown?.clientX,
    "Menu selection must point inside its rendered option",
  ).toBe(coords.clientX);
  expect(
    pointerDown?.clientY,
    "Menu selection must point inside its rendered option",
  ).toBe(coords.clientY);
}

export async function dismissHarnessPreferences(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole("button", { name: "Effort and model" });
  if (trigger.getAttribute("aria-expanded") === "true") {
    const activeMenu =
      canvasElement.ownerDocument.activeElement?.closest('[role="menu"]');
    await userEvent.keyboard("{Escape}");
    if (activeMenu)
      await waitFor(() => expect(activeMenu).not.toBeInTheDocument());
    if (trigger.getAttribute("aria-expanded") === "true")
      await userEvent.keyboard("{Escape}");
  }
  await waitFor(() => {
    expect(
      canvas.getByRole("button", { name: "Effort and model" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
    ).not.toBe("none");
    expect(
      canvasElement.ownerDocument.querySelector(
        '[data-ui-part="dropdown-menu-content"], [data-ui-part="dropdown-menu-sub-content"]',
      ),
      "Dismissal must finish removing preference portals before reopening",
    ).toBeNull();
  });
}

export async function waitForHarnessCatalog(
  canvasElement: HTMLElement,
  agent: string,
  runtime: string,
) {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
      "data-selected-agent",
      agent,
    );
    expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
      "data-selected-runtime",
      runtime,
    );
    expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-model-catalog-loading",
      "false",
    );
  });
}
