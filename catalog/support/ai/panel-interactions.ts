// SPDX-License-Identifier: Apache-2.0
import { expect, waitFor, within } from "storybook/test";
export async function readyPanel(element: HTMLElement, testId: string) {
  const canvas = within(element);
  await waitFor(() => {
    expect(element.querySelector('[data-panels-ready="true"]')).not.toBeNull();
    expect(canvas.getByTestId(testId)).toBeVisible();
    expect(canvas.queryByText(/Loading (conversations|catalog)…/)).toBeNull();
  });
  return within(canvas.getByTestId(testId));
}
export async function inspectPanel(element: HTMLElement) {
  const canvas = within(element);
  canvas.getByRole("button", { name: "Inspect panel state" }).click();
  await Promise.resolve();
  return JSON.parse(
    canvas.getByLabelText("Panel fixture state").textContent ?? "{}",
  );
}
