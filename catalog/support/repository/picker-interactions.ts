import { expect, userEvent, waitFor, within } from "storybook/test";

/** Drive the same public Command View control used by the live plugin. */
export async function chooseChangedRevision(
  canvas: ReturnType<typeof within>,
  change = "aa".repeat(16),
) {
  const trigger = await canvas.findByRole("button", {
    name: "Choose changed revisions",
  });
  await userEvent.click(trigger);
  const element = await waitFor(() => {
    const open = within(document.body)
      .getAllByRole("dialog", { name: "Choose changed revisions" })
      .find((element) => element.dataset.state === "open");
    expect(open).toBeVisible();
    return open!;
  });
  await userEvent.click(
    await within(element).findByRole("row", {
      name: (name) => name.endsWith(`(${change})`),
    }),
  );
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await waitFor(() => expect(element).not.toBeInTheDocument());
}
