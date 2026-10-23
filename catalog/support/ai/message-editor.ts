import { within } from "storybook/test";
type Canvas = ReturnType<typeof within>;
/** Scope the editable draft separately from read-only Classic message readers. */
export function messageEditor(canvas: Canvas) {
  return within(
    canvas.getByRole("group", { name: "Message composer" }),
  ).getByRole("textbox", { name: "Message" });
}
export async function findMessageEditor(canvas: Canvas) {
  return within(
    await canvas.findByRole("group", { name: "Message composer" }),
  ).getByRole("textbox", { name: "Message" });
}
