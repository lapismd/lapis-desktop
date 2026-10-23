import { expect, userEvent, within, waitFor } from "storybook/test";

export async function showSendingError(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() =>
    expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-initializing",
      "false",
    ),
  );
  await userEvent.click(canvas.getByRole("textbox", { name: /^Message$/ }));
  await userEvent.keyboard(
    "Summarize the open questions and suggest the next action.",
  );
  await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
}
