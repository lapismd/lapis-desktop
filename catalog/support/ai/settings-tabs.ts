import { expect, userEvent, waitFor, within } from "storybook/test";
import { clickHarnessControl } from "./menu-interactions.ts";

export async function selectSettingsTab(
  element: HTMLElement,
  label: string,
  name: string,
) {
  const canvas = within(element);
  await waitFor(() =>
    expect(
      canvas.queryByRole("tab", { name }) ??
        canvas.queryByRole("button", { name: `More ${label.toLowerCase()}` }),
    ).not.toBeNull(),
  );
  const tab = canvas.queryByRole("tab", { name });
  if (tab) await userEvent.click(tab);
  else {
    await userEvent.click(
      await canvas.findByRole("button", {
        name: `More ${label.toLowerCase()}`,
      }),
    );
    await clickHarnessControl(
      await within(element.ownerDocument.body).findByRole("menuitem", {
        name,
      }),
    );
  }
  await waitFor(() =>
    expect(canvas.getByRole("tabpanel", { name })).toBeVisible(),
  );
}

// Exercise the real Settings scroll owner, including the compact navigation bar.
export async function expectPinnedSettingsTabs(element: HTMLElement) {
  const demo = element.querySelector<HTMLElement>(".settings-demo")!;
  const strip = element.querySelector<HTMLElement>(".settings-tab-strip")!;
  const originalHeight = demo.style.height;
  demo.style.height = "240px";
  let viewport = strip.parentElement!;
  while (!/(auto|scroll)/.test(getComputedStyle(viewport).overflowY))
    viewport = viewport.parentElement!;
  try {
    viewport.scrollTop = 0;
    await waitFor(() => expect(viewport.clientHeight).toBeLessThanOrEqual(240));
    const top = strip.getBoundingClientRect().top;
    viewport.scrollTop = 120;
    await waitFor(() => {
      expect(viewport.scrollTop).toBeGreaterThan(80);
      expect(Math.abs(strip.getBoundingClientRect().top - top)).toBeLessThan(2);
    });
    expect(getComputedStyle(strip).backgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
    expect(strip.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      viewport.getBoundingClientRect().top,
    );
  } finally {
    viewport.scrollTop = 0;
    demo.style.height = originalHeight;
  }
}
