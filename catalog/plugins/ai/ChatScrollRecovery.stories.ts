import { messageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiShellDemo from "../../support/ai/shell/AiShellDemo.svelte";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import { shellFixture } from "../../support/ai/shell/fixture.ts";
const meta = {
  title: "Desktop/AI/Scroll recovery",
  component: AiShellDemo,
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
  args: {
    scenario: "registry-chat",
    reviewLayout: true,
    longMessages: true,
    holdRunning: true,
  },
} satisfies Meta<typeof AiShellDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
const afterLayout = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
async function verify(
  canvasElement: HTMLElement,
  classic: boolean,
  keepRunning = false,
) {
  const canvas = within(canvasElement);
  const panel = await canvas.findByTestId(
    "ai-chat-panel",
    {},
    { timeout: 30_000 },
  );
  await waitFor(() =>
    expect(panel).toHaveAttribute("data-initializing", "false"),
  );
  await canvas.findByRole(
    "textbox",
    { name: "Assistant response" },
    { timeout: 30000 },
  );
  if (classic)
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
  const region = canvas.getByRole("region", { name: "AI conversation" });
  const viewport = region.querySelector<HTMLElement>(
    '[data-ui-part="scroll-area-viewport"]',
  )!;
  await waitFor(() =>
    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight + 100),
  );
  await userEvent.click(canvas.getByRole("button", { name: "Preview turn 1" }));
  await afterLayout();
  viewport.scrollTo({ top: 0 });
  await afterLayout();
  await userEvent.click(
    await canvas.findByRole("button", { name: "Scroll to latest" }),
  );
  await waitFor(() =>
    expect(
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
    ).toBeLessThanOrEqual(8),
  );
  const editor = messageEditor(canvas);
  await userEvent.click(editor);
  await userEvent.keyboard(" Check scroll recovery");
  await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
  const stop = await canvas.findByRole("button", { name: "Stop agent" });
  await expect(
    await canvas.findByRole("button", { name: "Allow once" }),
  ).toBeVisible();
  // Let the held request's reader sizing settle before scrolling away.
  await afterLayout();
  viewport.scrollTo({ top: 0 });
  await afterLayout();
  expect(viewport.scrollTop).toBe(0);
  const latest = await canvas.findByRole("button", {
    name: "Scroll to latest (session running)",
  });
  expect(latest.querySelectorAll('[data-ui-part="activity-dot"]')).toHaveLength(
    3,
  );
  expect(latest).not.toHaveAttribute("aria-haspopup");
  if (classic)
    expect(latest.getBoundingClientRect().bottom).toBeLessThan(
      editor.getBoundingClientRect().top,
    );
  if (keepRunning) return;
  await userEvent.click(latest);
  await waitFor(() =>
    expect(
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop,
    ).toBeLessThanOrEqual(8),
  );
  await userEvent.click(stop);
  await waitFor(() =>
    expect(canvas.queryByRole("button", { name: "Stop agent" })).toBeNull(),
  );
  viewport.scrollTo({ top: 0 });
  const idle = await canvas.findByRole("button", { name: "Scroll to latest" });
  expect(idle.querySelector('[data-ui-part="activity-dot"]')).toBeNull();
}
export const DocumentRecovery: Story = {
  play: ({ canvasElement }) => verify(canvasElement, false),
};
export const ClassicRecovery: Story = {
  play: ({ canvasElement }) => verify(canvasElement, true),
};

export const RunningPreview: Story = {
  play: ({ canvasElement }) => verify(canvasElement, false, true),
};

export const PendingPermissionAcrossViews: Story = {
  play: async ({ canvasElement }) => {
    await verify(canvasElement, false, true);
    const canvas = within(canvasElement);
    const draft = messageEditor(canvas).textContent;
    const sessions = shellFixture(canvasElement).runtimes.flatMap(
      (runtime) => runtime.sessions,
    );
    const prompts = sessions.flatMap((session) => session.prompts);
    for (const next of ["Classic", "Document", "Classic"]) {
      await userEvent.click(
        canvas.getByRole("button", { name: `Switch to ${next} view` }),
      );
      await expect(
        await canvas.findByRole("button", { name: "Allow once" }),
      ).toBeVisible();
      expect(messageEditor(canvas)).toHaveTextContent(draft ?? "");
      expect(
        shellFixture(canvasElement).runtimes.flatMap(
          (runtime) => runtime.sessions,
        ),
      ).toEqual(sessions);
      expect(sessions.flatMap((session) => session.prompts)).toEqual(prompts);
    }
    await userEvent.click(canvas.getByRole("button", { name: "Allow once" }));
    await waitFor(() =>
      expect(canvas.queryByRole("button", { name: "Stop agent" })).toBeNull(),
    );
  },
};
