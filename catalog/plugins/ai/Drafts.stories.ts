import { messageEditor } from "../../support/ai/message-editor.ts";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { aiWorkspaceFixture } from "../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";

const meta = {
  title: "Desktop/AI/Conversation drafts",
  component: AiWorkspaceDemo,
  args: { kind: "ai-chat", layout: "middle-top-tabs" },
  beforeEach: () => cleanupCatalog,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SeparateConversations: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const open = async (title: string) => {
      if (
        !canvas.queryByRole("button", { name: new RegExp(`^Open ${title}`) })
      ) {
        await userEvent.click(
          canvas.getByRole("button", { name: "Toggle conversations" }),
        );
      }
      await userEvent.click(
        await canvas.findByRole("button", {
          name: new RegExp(`^Open ${title}`),
        }),
      );
      await waitFor(() =>
        expect(canvas.getByRole("heading", { name: title })).toBeVisible(),
      );
    };
    const input = () => messageEditor(canvas);
    await open("Summarize project notes");
    await userEvent.type(input(), "Draft for the notes conversation");
    await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: /Welcome/,
      }),
    );
    const comment = canvas.getByRole("button", {
      name: "Comment on Your message",
    });
    comment.focus();
    await userEvent.click(comment);
    await userEvent.type(
      await canvas.findByRole("textbox", { name: "Comment on Your message" }),
      "Comment only for the notes conversation",
    );
    await open("Fix parser errors");
    await waitFor(() =>
      expect(input()).not.toHaveTextContent("Draft for the notes conversation"),
    );
    expect(canvas.queryByRole("button", { name: "Remove Welcome" })).toBeNull();
    expect(
      canvas.queryByText("Comment only for the notes conversation"),
    ).toBeNull();
    await userEvent.type(input(), "Draft for the parser conversation");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(input()).toHaveTextContent("Draft for the parser conversation");
    await open("Summarize project notes");
    await waitFor(() =>
      expect(input()).toHaveTextContent("Draft for the notes conversation"),
    );
    expect(
      canvas.getByRole("button", { name: "Remove Welcome" }),
    ).toBeVisible();
    expect(
      canvas.getByRole("group", { name: "Pending comments" }),
    ).toHaveTextContent("Comment only for the notes conversation");
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Document view" }),
    );
    expect(input()).toHaveTextContent("Draft for the notes conversation");
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};

export const ReopenWithoutSending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const host = fixture.plugin()!.application;
    const entries = await host.conversations.listAll();
    const entry = entries.find(
      (entry) => entry.metadata?.title === "Summarize project notes",
    )!;
    await host.openAiConversation(entry.location);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-draft-ready",
        "true",
      ),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const input = () => messageEditor(canvas);
    await userEvent.type(
      input(),
      "A private draft that survives restarting AI",
    );
    await fixture.app.plugins.disablePlugin("ai");
    await fixture.app.plugins.enablePlugin("ai");
    const reopened = fixture.plugin()!.application;
    expect(reopened).not.toBe(host);
    await reopened.openAiConversation(entry.location);
    await waitFor(() =>
      expect(input()).toHaveTextContent(
        "A private draft that survives restarting AI",
      ),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(input()).toHaveTextContent(
      "A private draft that survives restarting AI",
    );
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};

export const NewChatAndAcknowledgement: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const host = fixture.plugin()!.application;
    const entry = (await host.conversations.listAll()).find(
      (entry) => entry.metadata?.title === "Summarize project notes",
    )!;
    await host.openAiConversation(entry.location);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-draft-ready",
        "true",
      ),
    );
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const input = () => messageEditor(canvas);
    await userEvent.type(input(), "Keep this in the original conversation");
    if (!canvas.queryByRole("button", { name: "New conversation" }))
      await userEvent.click(
        canvas.getByRole("button", { name: "Toggle conversations" }),
      );
    await userEvent.click(
      canvas.getByRole("button", { name: "New conversation" }),
    );
    await waitFor(() => {
      expect(
        canvas.getByRole("heading", { name: "Untitled conversation" }),
      ).toBeVisible();
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-draft-ready",
        "true",
      );
      expect(input()).not.toHaveTextContent(
        "Keep this in the original conversation",
      );
    });
    await userEvent.type(input(), "Publish only this message");
    await userEvent.click(
      canvas.getByRole("button", { name: /^Send message$/ }),
    );
    await waitFor(() =>
      expect(input()).not.toHaveTextContent("Publish only this message"),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Assistant response" }),
      ).toHaveTextContent("Publish only this message"),
    );
    await host.openAiConversation(entry.location);
    await waitFor(() =>
      expect(input()).toHaveTextContent(
        "Keep this in the original conversation",
      ),
    );
    expect(
      JSON.parse(await fixture.inspect()).sessions.flatMap(
        (session: { prompts: string[] }) => session.prompts,
      ),
    ).toEqual(["Publish only this message"]);
  },
};

export const StorageFailureKeepsDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const host = fixture.plugin()!.application;
    const save = host.drafts.save.bind(host.drafts);
    host.drafts.save = async () => {
      throw new Error("Fixture draft disk is full");
    };
    const input = messageEditor(canvas);
    await userEvent.type(input, "Retain this draft after a failed save");
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      await body.findByText("Fixture draft disk is full"),
    ).toBeVisible();
    expect(input).toHaveTextContent("Retain this draft after a failed save");
    host.drafts.save = save;
    await userEvent.type(input, " and retry");
    await waitFor(() =>
      expect(body.queryByText("Fixture draft disk is full")).toBeNull(),
    );
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};

export const FirstSendAdoptsUnassignedDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      );
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-draft-ready",
        "true",
      );
    });
    const host = fixture.plugin()!.application;
    const input = () => messageEditor(canvas);
    await userEvent.type(input(), "A first message from an unassigned draft");
    await userEvent.click(
      canvas.getByRole("button", { name: /^Send message$/ }),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole("textbox", { name: "Assistant response" }),
      ).toHaveTextContent("A first message from an unassigned draft"),
    );
    await waitFor(() =>
      expect(input()).not.toHaveTextContent(
        "A first message from an unassigned draft",
      ),
    );
    const location = (await host.conversations.listAll()).find(
      (entry) =>
        entry.metadata?.title === "A first message from an unassigned draft",
    )!.location;
    await waitFor(async () =>
      expect(
        (
          await host.drafts.read(
            JSON.stringify([location.scopeDir, location.conversationId]),
          )
        ).text,
      ).toBe(""),
    );
    expect(
      JSON.parse(await fixture.inspect()).sessions.flatMap(
        (session: { prompts: string[] }) => session.prompts,
      ),
    ).toEqual(["A first message from an unassigned draft"]);
  },
};

export const LateReadDoesNotReplaceSelectedDraft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      fixture = aiWorkspaceFixture(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-initializing",
        "false",
      ),
    );
    const host = fixture.plugin()!.application,
      read = host.drafts.read.bind(host.drafts);
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    host.drafts.read = async (key) => {
      if (key.includes("123e4567-e89b-42d3-a456-426614174000")) {
        await held;
        return { text: "An obsolete late draft", attachments: [], threads: [] };
      }
      return read(key);
    };
    const open = async (title: string) => {
      if (!canvas.queryByRole("button", { name: new RegExp(`^Open ${title}`) }))
        await userEvent.click(
          canvas.getByRole("button", { name: "Toggle conversations" }),
        );
      await userEvent.click(
        await canvas.findByRole("button", {
          name: new RegExp(`^Open ${title}`),
        }),
      );
    };
    await open("Summarize project notes");
    await open("Fix parser errors");
    await waitFor(() =>
      expect(canvas.getByTestId("ai-chat-panel")).toHaveAttribute(
        "data-draft-ready",
        "true",
      ),
    );
    const input = messageEditor(canvas);
    await userEvent.type(input, "Keep the selected parser draft");
    release();
    await held;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    expect(input).toHaveTextContent("Keep the selected parser draft");
    expect(input).not.toHaveTextContent("An obsolete late draft");
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
