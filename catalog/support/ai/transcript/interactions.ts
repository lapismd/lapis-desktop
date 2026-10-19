// SPDX-License-Identifier: Apache-2.0
import { userEvent, within } from "storybook/test";
/** Exercise the shared disclosures before checking the retained activity payload. */
export async function expandTranscriptActivity(element: HTMLElement) {
  for (const trigger of within(element).queryAllByRole("button", {
    name: /^(Skill activation|Command result|Context and activity|Permission response|Question response)$/,
  })) {
    if (trigger.getAttribute("aria-expanded") === "false")
      await userEvent.click(trigger);
  }
}
