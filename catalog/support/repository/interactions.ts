import { expect, userEvent, waitFor, within } from "storybook/test";

export async function openHistory(element: HTMLElement) {
  const canvas = within(element);
  await waitFor(
    () =>
      expect(element.querySelector('[data-notes-ready="true"]')).not.toBeNull(),
    { timeout: 30_000 },
  );
  await userEvent.click(
    await canvas.findByRole("button", {
      name: "Repository History",
    }),
  );
  const panel = await canvas.findByRole("region", {
    name: "Repository history",
  });
  return within(panel);
}
export async function openHistoryFile(element: HTMLElement) {
  const canvas = await openHistory(element);
  await userEvent.click(
    await canvas.findByRole("button", {
      name: /Keep repository history beside the notes/,
    }),
  );
  await userEvent.click(
    await canvas.findByRole("button", { name: "Welcome.md" }),
  );
  return canvas;
}
