import { expect, userEvent, within } from "storybook/test";

export async function reviewInlineFooter(root: HTMLElement) {
  const canvas = within(root);
  const footer = canvas.getByRole("group", {
    name: /^Message\ actions$/,
  });
  const toggle = within(footer).getByRole("button", {
    name: /^Formatting\ options$/,
  });
  const before = footer.getBoundingClientRect().height;
  await expect(before).toBeLessThanOrEqual(49);
  await userEvent.click(toggle);
  await expect(
    within(footer).getByRole("button", { name: /^Bold$/ }),
  ).toBeVisible();
  await expect(footer.getBoundingClientRect().height).toBe(before);
  const send = footer.querySelector<HTMLElement>("[data-action]")!;
  await expect(
    Math.abs(toggle.getBoundingClientRect().y - send.getBoundingClientRect().y),
  ).toBeLessThan(1);
  await userEvent.click(
    within(footer).getByRole("button", {
      name: /^Hide\ formatting$/,
    }),
  );
  await expect(
    within(footer).getByRole("button", { name: /^Add\ emoji$/ }),
  ).toBeVisible();
  await expect(footer.getBoundingClientRect().height).toBe(before);
}
