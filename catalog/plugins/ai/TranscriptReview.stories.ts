import { reviewInlineFooter } from "../../support/ai/transcript/footer-review.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import TranscriptReviewDemo from "../../support/ai/transcript/TranscriptReviewDemo.svelte";
import { aiReviewValue } from "../../support/ai/review.ts";

const meta = {
  title: "Desktop/AI/Transcript review",
  component: TranscriptReviewDemo,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TranscriptReviewDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DocumentConversation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("group", { name: /^Message\ actions$/ });
    await reviewInlineFooter(canvasElement);
    await expect(
      canvas.findByRole("region", { name: "AI conversation" }),
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Document" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.findByText("A quieter daily review"),
    ).resolves.toBeInTheDocument();
    const table = await canvas.findByRole("table");
    const preview = table.closest(".ui-transcript-markdown-preview")!;
    await expect(getComputedStyle(preview).whiteSpace).toBe("normal");
    await expect(
      preview.getBoundingClientRect().height -
        table.getBoundingClientRect().height,
    ).toBeLessThan(40);
    await expect(
      within(table)
        .getByRole("cell", { name: "Research" })
        .getBoundingClientRect().height,
    ).toBeLessThan(48);
    await expect(table.querySelector(".cm-gutters")).toBeNull();
    const code = await canvas.findByRole("textbox", { name: "markdown code" });
    await expect(code).toHaveTextContent("# Daily review");
    await expect(canvas.getByText("Markdown", { exact: true })).toBeVisible();
    await waitFor(() =>
      expect(
        [...code.querySelectorAll("span[class]")].some(
          (token) =>
            getComputedStyle(token).color !== getComputedStyle(code).color,
        ),
      ).toBe(true),
    );
    const avatar = canvasElement.querySelector<HTMLElement>(
      '[data-ui-component="avatar"] [data-ui-part="content"]',
    )!;
    await expect(getComputedStyle(avatar).display).toBe("grid");
    await expect(getComputedStyle(avatar).alignItems).toBe("center");
  },
};

export const ClassicConversation: Story = {
  args: { scenario: "classic" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.findByRole("button", { name: "Classic" }),
    ).resolves.toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.findByText("A quieter daily review"),
    ).resolves.toBeInTheDocument();
  },
};
export const SwitchWithDraft: Story = {
  args: { scenario: "empty" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await canvas.findByRole("textbox", { name: "Message" });
    await userEvent.click(editor);
    await userEvent.keyboard("Keep this draft while switching views");
    await userEvent.click(canvas.getByRole("button", { name: "Classic" }));
    await expect(editor).toBeInTheDocument();
    await expect(editor).toHaveTextContent(
      "Keep this draft while switching views",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Document" }));
    await expect(editor).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.findByText("Summary")).resolves.toBeInTheDocument();
  },
};
export const EmptyConversation: Story = { args: { scenario: "empty" } };
export const LongCodeBlock: Story = {
  args: { scenario: "long-code" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = await canvas.findByRole("button", {
      name: "Show 40 more lines in typescript code",
    });
    await userEvent.click(more);
    await expect(
      canvas.getByRole("button", { name: "Show less in typescript code" }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show less in typescript code" }),
    );
    await expect(
      canvas.getByRole("button", {
        name: "Show 40 more lines in typescript code",
      }),
    ).toBeVisible();
  },
};
export const LoadingConversation: Story = { args: { scenario: "loading" } };
export const InterruptedTurn: Story = { args: { scenario: "failure" } };
export const PermissionRequest: Story = {
  args: { scenario: "approval" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await canvas.findByRole("textbox", { name: "Message" });
    await userEvent.click(editor);
    await userEvent.keyboard("Review the note");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(
      canvas.findByText("Allow the fake agent to continue?"),
    ).resolves.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Classic" }));
    await expect(
      canvas.getByText("Allow the fake agent to continue?"),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Stop agent" }));
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Stop agent" }),
      ).not.toBeInTheDocument(),
    );
  },
};
export const QuestionRequest: Story = {
  args: { scenario: "question" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = await canvas.findByRole("textbox", { name: "Message" });
    await userEvent.click(editor);
    await userEvent.keyboard("Help plan the review");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(
      canvas.findByText("How should I update the sample file?"),
    ).resolves.toBeVisible();
  },
};

export const CommentsAsContext: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("region", { name: "AI conversation" });
    const comment = canvas.getAllByRole("button", {
      name: "Comment on Assistant response",
    })[0]!;
    await userEvent.click(comment);
    const editor = await canvas.findByRole("textbox", {
      name: "Comment on Assistant response",
    });
    await userEvent.click(editor);
    await userEvent.keyboard("Use a weekly review for this part instead.");
    await userEvent.click(canvas.getByRole("button", { name: "Classic" }));
    await expect(
      canvas.getByRole("group", { name: "Pending comments" }),
    ).toHaveTextContent("Use a weekly review for this part instead.");
    await userEvent.click(canvas.getByRole("button", { name: "Document" }));
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.findByText("Summary")).resolves.toBeInTheDocument();
    await waitFor(() => {
      const sessions = JSON.parse(aiReviewValue(canvasElement, "runtime"));
      expect(sessions.at(-1).prompts).toEqual([""]);
      const context = sessions
        .at(-1)
        .context[0].find(
          (block: { kind: string }) => block.kind === "transcript-comments",
        );
      expect(JSON.parse(context.content).comments[0]).toMatchObject({
        text: "Use a weekly review for this part instead.",
        anchor: { blockId: "review-response/body" },
      });
    });
  },
};

export const CodeAndTableComments: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const code = await canvas.findByRole("textbox", { name: "markdown code" });
    await userEvent.click(code);
    await userEvent.keyboard(
      "{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{Home}{Shift>}{End}{/Shift}{Control>}{Alt>}m{/Alt}{/Control}",
    );
    const comment = await canvas.findByRole("textbox", {
      name: "Comment on Assistant response",
    });
    await userEvent.click(comment);
    await userEvent.keyboard("Keep this code example.");
    const table = canvas.getByRole("table");
    const cell = within(table).getByRole("cell", {
      name: "Link the three open questions",
    });
    await userEvent.click(within(cell).getByRole("textbox"));
    await userEvent.keyboard(
      "{Home}{Shift>}{End}{/Shift}{Control>}{Alt>}m{/Alt}{/Control}",
    );
    await waitFor(() =>
      expect(
        canvas.getAllByRole("group", {
          name: "Inline comments on Assistant response",
        }),
      ).toHaveLength(2),
    );
    const areas = canvas.getAllByRole("group", {
      name: "Inline comments on Assistant response",
    });
    await userEvent.click(
      within(areas.at(-1)!).getByRole("textbox", {
        name: "Comment on Assistant response",
      }),
    );
    await userEvent.keyboard("Focus on this research action.");
    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));
    await expect(canvas.findByText("Summary")).resolves.toBeInTheDocument();
    await waitFor(() => {
      const sessions = JSON.parse(aiReviewValue(canvasElement, "runtime"));
      const context = sessions
        .at(-1)
        .context[0].find(
          (block: { kind: string }) => block.kind === "transcript-comments",
        );
      const comments = JSON.parse(context.content).comments;
      expect(
        comments.map(
          (comment: { anchor: { quote: string } }) => comment.anchor.quote,
        ),
      ).toEqual(["# Daily review", "Link the three open questions"]);
      expect(comments[1].anchor.tableContext.markdown).toContain(
        "Research | Link the three open questions | Tomorrow",
      );
      expect(sessions.at(-1).prompts).toEqual([""]);
    });
  },
};

export const TableRowComments: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("table");
    for (const [quote, text] of [
      [
        "Link the three open questions",
        "Keep this research action focused on the unresolved questions.",
      ],
      [
        "Review the inbox",
        "Make this a weekly review rather than a daily task.",
      ],
    ]) {
      const table = canvasElement.querySelector<HTMLElement>(
        ".ui-transcript-rich-table",
      )!;
      await userEvent.click(
        within(within(table).getByRole("cell", { name: quote })).getByRole(
          "textbox",
        ),
      );
      await userEvent.keyboard(
        "{Home}{Shift>}{End}{/Shift}{Control>}{Alt>}m{/Alt}{/Control}",
      );
      await waitFor(() =>
        expect(
          within(table).getAllByRole("group", {
            name: "Inline comments on Assistant response",
          }).length,
        ).toBe(quote === "Review the inbox" ? 2 : 1),
      );
      const areas = within(table).getAllByRole("group", {
        name: "Inline comments on Assistant response",
      });
      const editor = within(areas.at(-1)!).getByRole("textbox", {
        name: "Comment on Assistant response",
      });
      await userEvent.click(editor);
      await userEvent.keyboard(text);
    }
    const table = canvasElement.querySelector<HTMLElement>(
      ".ui-transcript-rich-table",
    )!;
    await expect(table.querySelectorAll("table")).toHaveLength(2);
    const queue = canvas.getByRole("group", { name: "Pending comments" });
    await expect(
      within(queue).getAllByRole("table", { name: "Commented table row" }),
    ).toHaveLength(2);
    await expect(queue).toHaveTextContent("Research");
    await expect(queue).toHaveTextContent("Planning");
    await expect(table.querySelector(".cm-gutters")).toBeNull();
  },
};
