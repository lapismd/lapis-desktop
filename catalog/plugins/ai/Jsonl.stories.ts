// SPDX-License-Identifier: Apache-2.0
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AiWorkspaceDemo from "../../support/ai/workspace/AiWorkspaceDemo.svelte";
import { aiWorkspaceFixture } from "../../support/ai/workspace/fixture.ts";
import { cleanupCatalog } from "../../support/lifecycle.ts";
import {
  agents,
  transcript,
  largeTranscript,
  lines,
  time,
} from "../../support/ai/jsonl/records.ts";
const meta = {
  title: "Desktop/AI/JSONL",
  component: AiWorkspaceDemo,
  args: { kind: "ai-history", layout: "right-sidebar" },
  tags: ["visual-pending", "!autodocs"],
  beforeEach: () => cleanupCatalog,
} satisfies Meta<typeof AiWorkspaceDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(element: HTMLElement, name: string, content: string) {
  const fixture = aiWorkspaceFixture(element);
  await fixture.ready;
  await waitFor(() =>
    expect(
      element.querySelector('[data-app-shell-ready="true"]'),
    ).not.toBeNull(),
  );
  const file = await fixture.app.vault.create(`Notes/${name}`, content);
  const leaf = fixture.app.workspace.getLeaf("tab");
  await leaf.openFile(file);
  fixture.app.workspace.activateLeaf(leaf, {
    focusRootHost: false,
    source: "api",
    operation: "preview-jsonl",
  });
  await fixture.app.workspace.revealLeaf(leaf);
  await waitFor(() => expect(leaf.view.getViewType()).toBe("ai-jsonl"));
  const root = leaf.containerEl.querySelector<HTMLElement>(
    '[data-ui-component="ai-jsonl-view"]',
  );
  if (!root) throw new Error("JSONL view did not mount");
  await waitFor(() => {
    expect(root).toBeVisible();
    expect(root).toHaveAttribute("data-file-path", file.path);
  });
  return { fixture, file, leaf, root, preview: within(root) };
}
export const SavedLocalCommands: Story = {
  play: async ({ canvasElement }) => {
    const text =
      "App\n  /help — Show commands\n\nActions\n  /search <query> — Search notes";
    const { root, preview } = await open(
      canvasElement,
      "transcript.jsonl",
      lines([
        {
          schemaVersion: 1,
          id: "saved-help",
          type: "system.notice",
          layout: "report",
          text,
          createdAt: time,
        },
        {
          schemaVersion: 1,
          id: "saved-search",
          type: "tool",
          toolId: "slash-tool-saved-search",
          name: "notes_search",
          state: "completed",
          output: "A captured search result",
          createdAt: time,
        },
      ]),
    );
    const report = await preview.findByLabelText("Command output");
    expect(report.textContent).toBe(text);
    expect(getComputedStyle(report).whiteSpace).toBe("pre-wrap");
    expect(
      preview.getByRole("button", { name: "Hide details for notes_search" }),
    ).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      preview.getByRole("button", { name: "Hide details for notes_search" }),
    );
    await userEvent.click(
      preview.getByRole("button", { name: "Show details for notes_search" }),
    );
    expect(preview.queryByLabelText("Tool details")).toBeNull();
    expect(root.querySelector("[data-transcript-composer]")).toBeNull();
    expect(preview.queryByRole("button", { name: /^Comment on/ })).toBeNull();
  },
};
export const Transcript: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, file, leaf, root, preview } = await open(
      canvasElement,
      "transcript.jsonl",
      transcript,
    );
    expect(root).toHaveAttribute("data-preview-kind", "transcript");
    expect(root).toHaveAttribute("data-file-path", file.path);
    expect(fixture.app.workspace.getLeavesOfType("ai-jsonl")).toHaveLength(1);
    expect(fixture.app.workspace.editorViews.get("ai-jsonl")).toMatchObject({
      viewType: "ai-jsonl",
      priority: "default",
      filenamePatterns: expect.arrayContaining([".jsonl", "*.jsonl"]),
    });
    expect(await preview.findByText("one active project")).toBeVisible();
    expect(preview.getByText("Summarize", { exact: false })).toBeVisible();
    expect(
      preview.getByRole("button", { name: "Show details for notes_search" }),
    ).toBeVisible();
    expect(preview.queryByRole("combobox", { name: "Message" })).toBeNull();
    expect(
      root.querySelector('[data-conversation-view="document"]'),
    ).not.toBeNull();
    expect(root.querySelector(".ai-session-shell")).not.toBeNull();
    expect(preview.getByLabelText("File preview status")).toHaveTextContent(
      "Read-only",
    );
    await userEvent.click(
      preview.getByRole("button", { name: "Switch to Classic view" }),
    );
    expect(
      root.querySelector('[data-conversation-view="classic"]'),
    ).not.toBeNull();
    expect(
      preview.getByRole("article", { name: "Message from Assistant" }),
    ).toHaveTextContent("one active project");
    expect(
      root.querySelector('[data-ui-component="ai-chat-composer"]'),
    ).toBeNull();
    expect(root.querySelector('[data-ui-part="composer-dock"]')).toBeNull();
    expect(preview.queryByRole("button", { name: /^Comment on/ })).toBeNull();
    const { TextFileView } = await import("@lapis-notes/api");
    expect(leaf.view).toBeInstanceOf(TextFileView);
    await (leaf.view as InstanceType<typeof TextFileView>).save(true);
    expect(await fixture.app.vault.read(file)).toBe(transcript);
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
export const AgentEvents: Story = {
  play: async ({ canvasElement }) => {
    const { root, preview, fixture } = await open(
      canvasElement,
      "agents.jsonl",
      agents,
    );
    expect(root).toHaveAttribute("data-preview-kind", "agents");
    expect(
      await preview.findByText(/Agent binding created · codex/),
    ).toBeVisible();
    expect(preview.getByText(/Context usage updated/)).toBeVisible();
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
export const StructuredRefreshAndRename: Story = {
  play: async ({ canvasElement }) => {
    const content = '{"event":"created"}\n["one","two"]\n';
    const { root, preview, fixture, file, leaf } = await open(
      canvasElement,
      "events.jsonl",
      content,
    );
    expect(root).toHaveAttribute("data-preview-kind", "records");
    expect(preview.getByText("Line 2")).toBeVisible();
    await leaf.openFile(file);
    expect(root).toBeVisible();
    await fixture.app.vault.modify(file, '{"event":"refreshed"}\n');
    await waitFor(() => expect(root).toHaveTextContent('"refreshed"'));
    await fixture.app.fileManager.renameFile(file, "Notes/transcript.jsonl");
    await waitFor(() => {
      expect(root).toHaveAttribute("data-file-path", "Notes/transcript.jsonl");
      expect(root).toHaveAttribute("data-preview-kind", "error");
    });
    await fixture.app.fileManager.renameFile(file, "Notes/events.jsonl");
    await waitFor(() =>
      expect(root).toHaveAttribute("data-preview-kind", "records"),
    );
    const former = root;
    await fixture.app.plugins.disablePlugin("ai");
    expect(former.isConnected).toBe(false);
    await fixture.app.plugins.enablePlugin("ai");
    await leaf.openFile(file);
    await waitFor(() => expect(leaf.view.getViewType()).toBe("ai-jsonl"));
    expect(await fixture.app.vault.read(file)).toBe('{"event":"refreshed"}\n');
    expect(JSON.parse(await fixture.inspect())).toMatchObject({
      sessions: [],
      notices: [],
    });
  },
};
export const InterruptedAppend: Story = {
  play: async ({ canvasElement }) => {
    const { root, preview } = await open(
      canvasElement,
      "transcript.jsonl",
      transcript + '{"schemaVersion":1',
    );
    expect(root).toHaveAttribute("data-preview-kind", "transcript");
    expect(await preview.findByText("one active project")).toBeVisible();
    expect(
      preview.getByText(/Ignored a malformed final JSONL line/),
    ).toBeVisible();
  },
};
export const MalformedRecord: Story = {
  play: async ({ canvasElement }) => {
    const { root, preview } = await open(
      canvasElement,
      "transcript.jsonl",
      transcript + "not-json\n",
    );
    expect(root).toHaveAttribute("data-preview-kind", "error");
    expect(
      preview.getByText("transcript.jsonl contains invalid JSON on line 5"),
    ).toBeVisible();
  },
};
export const EmptyFile: Story = {
  play: async ({ canvasElement }) => {
    const { preview, root } = await open(canvasElement, "events.jsonl", "");
    expect(preview.getByText("Empty JSONL file")).toBeVisible();
    expect(root.querySelector('[data-ui-part="composer-dock"]')).toBeNull();
  },
};
export const DisableDuringFileRead: Story = {
  play: async ({ canvasElement }) => {
    const fixture = aiWorkspaceFixture(canvasElement);
    await fixture.ready;
    await within(canvasElement).findByRole("tree", {
      name: "Conversation history",
    });
    const file = await fixture.app.vault.create(
      "Notes/pending.jsonl",
      '{"event":"pending"}\n',
    );
    const adapter = fixture.app.vault.adapter;
    const read = adapter.read.bind(adapter);
    let release!: () => void;
    let started!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reading = new Promise<void>((resolve) => {
      started = resolve;
    });
    adapter.read = async (path) => {
      if (path === file.path) {
        started();
        await pending;
      }
      return read(path);
    };
    const leaf = fixture.app.workspace.getLeaf("tab");
    const opened = leaf.openFile(file);
    try {
      await reading;
      let disabled = false;
      const closing = fixture.app.plugins.disablePlugin("ai").then((value) => {
        disabled = true;
        return value;
      });
      await waitFor(() =>
        expect(
          within(canvasElement).queryByRole("tree", {
            name: "Conversation history",
          }),
        ).toBeNull(),
      );
      expect(disabled).toBe(false);
      release();
      await opened;
      expect(await closing).toBe(true);
      expect(
        leaf.containerEl.querySelector('[data-ui-component="ai-jsonl-view"]'),
      ).toBeNull();
      expect(await read(file.path)).toBe('{"event":"pending"}\n');
      expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
    } finally {
      release();
      adapter.read = read;
      await opened;
    }
  },
};

export const LargeTranscript: Story = {
  play: async ({ canvasElement }) => {
    const { root, preview, fixture, file } = await open(
      canvasElement,
      "transcript.jsonl",
      largeTranscript,
    );
    const read = preview.getByRole("button", {
      name: "Show details for read_file · Notes/Plan.md",
    });
    await userEvent.click(read);
    const inspector = await within(
      canvasElement.ownerDocument.body,
    ).findByLabelText("Tool details");
    await expect(
      within(inspector).findByText("Release plan"),
    ).resolves.toBeVisible();
    await userEvent.click(
      within(inspector).getByRole("button", { name: /^Source$/ }),
    );
    await expect(
      within(inspector).findByRole("textbox", { name: /Notes\/Plan.md/ }),
    ).resolves.toHaveTextContent("# Release plan");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(read).toHaveFocus());
    expect(
      root.querySelector('[data-ui-component="scroll-area"]'),
    ).not.toBeNull();
    expect(await fixture.app.vault.read(file)).toBe(largeTranscript);
    expect(JSON.parse(await fixture.inspect()).sessions).toEqual([]);
  },
};
export const LoadingFile: Story = {
  play: async ({ canvasElement }) => {
    const { fixture, file, leaf } = await open(
      canvasElement,
      "transcript.jsonl",
      transcript,
    );
    const adapter = fixture.app.vault.adapter,
      original = adapter.read.bind(adapter);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    adapter.read = async (path) => {
      if (path === file.path) await gate;
      return original(path);
    };
    const { TextFileView } = await import("@lapis-notes/api");
    const opened = (leaf.view as InstanceType<typeof TextFileView>).onLoadFile(
      file,
    );
    try {
      await waitFor(() =>
        expect(
          leaf.containerEl.querySelector(
            '[data-ui-component="ai-jsonl-view"][aria-busy="true"]',
          ),
        ).not.toBeNull(),
      );
      expect(
        leaf.containerEl.querySelector('[data-ui-component="skeleton"]'),
      ).not.toBeNull();
      release();
      await opened;
      await waitFor(() =>
        expect(leaf.containerEl).toHaveTextContent("one active project"),
      );
    } finally {
      release();
      adapter.read = original;
      await opened;
    }
  },
};
