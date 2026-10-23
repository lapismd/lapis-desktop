import { expect, it, vi } from "vitest";
import { mentionTriggers } from "../../../src/lib/ai/chat/panel/mention-triggers.ts";
import type { ComposerState } from "../../../src/lib/ai/chat/panel/composer.svelte.ts";
import type { AiChatController } from "../../../src/lib/ai/chat/chat-controller.svelte.ts";
import {
  agentIdFromHref,
  agentMentionReferences,
  formatAgentMention,
} from "../../../src/lib/ai/chat/agent-mentions.ts";
import { agentMentionToken } from "@lapismd/jj-conversations";
import { EditorState } from "@codemirror/state";
import { createMiraMarkdownLanguage } from "@lapismd/mira/codemirror";
import { composerReferenceRanges } from "../../../src/lib/ai/chat/composer-reference-ranges.ts";
import {
  removeInlineRecipient,
  appendInlineRecipient,
} from "../../../src/lib/ai/chat/panel/inline-audience.svelte.ts";
import { ComposerRecipients } from "../../../src/lib/ai/chat/panel/recipients.svelte.ts";
import { transcriptLinks } from "../../../src/components/ai/chat/transcript-agent-links.ts";

it("preserves Markdown leaf shape in captured handoff context", () => {
  const leaf = {
    type: "pathlink",
    value: "User",
    data: { hName: "pathlink", hChildren: [{ type: "text", value: "User" }] },
  };
  const tree = {
    type: "root",
    children: [{ type: "paragraph", children: [leaf] }],
  };
  const original = structuredClone(tree);
  const extension = transcriptLinks().markdown.extensions.find(
    (entry) => entry.name === "lapis-agent-mentions",
  )!;
  const plugin = extension.remarkPlugins![0] as () => (
    tree: unknown,
    file: unknown,
  ) => void;
  plugin()(tree, { value: "[User]" });
  expect(tree).toStrictEqual(original);
  expect(leaf).not.toHaveProperty("children");
});

it("inserts a Markdown agent link without dispatching a message", () => {
  const selectRecipient = vi.fn();
  const composer = {
    recipientOptions: [{ id: "reviewer", label: "Nyra", agent: "codex" }],
    selectRecipient,
  } as unknown as ComposerState;
  const trigger = mentionTriggers({}, composer, {} as AiChatController)[0]!;
  expect(trigger.onSelect({ id: "agent:reviewer", label: "Nyra" })).toBe(
    "[Nyra](lapis://agent:7265766965776572) ",
  );
  expect(selectRecipient).toHaveBeenCalledExactlyOnceWith("reviewer", false);
});

it("round-trips exact setup IDs and escaped human labels without changing metadata", () => {
  const id = "participant-Nyra-😀";
  const link = formatAgentMention(id, "Nyra [Review] \\ Team");
  expect(agentMentionReferences(link)).toEqual([
    { from: 0, to: link.length, agentId: id, label: "Nyra [Review] \\ Team" },
  ]);
  expect(agentIdFromHref("lapis://agent:ff")).toBeUndefined();
  expect(agentIdFromHref("lapis://agent:41;ignored")).toBeUndefined();
  expect(agentIdFromHref("https://example.com/agent:41")).toBeUndefined();
  expect(agentIdFromHref("lapis://agent:00")).toBeUndefined();
  expect(agentIdFromHref("lapis://agent:7")).toBeUndefined();
});

it("keeps old tokens readable but ignores code, images and unrelated link labels", () => {
  const legacy = agentMentionToken("reviewer"),
    link = formatAgentMention("reviewer", "Nyra");
  const text = `😀 ${legacy} and ${link}\n\n\`${legacy}\`\n\n\`\`\`md\n${link}\n\`\`\`\n\n![Nyra](lapis://agent:7265766965776572)\n\n[${legacy}](https://example.com)\n\n\\${legacy}`;
  expect(
    agentMentionReferences(text).map((ref) => text.slice(ref.from, ref.to)),
  ).toEqual([legacy, link]);
});

it("renders the bare agent spelling with exact source ranges, including the reported ID", () => {
  const id = "participant-7297795f-c00b-475e-b430-5b0e2e11a2e3";
  const raw =
    "agent:7061727469636970616e742d37323937373935662d633030622d343735652d623433302d356230653265313161326533;";
  expect(agentMentionReferences(`Hello ${raw} again`)).toEqual([
    { from: 6, to: 6 + raw.length, agentId: id },
  ]);
  expect(
    agentMentionReferences(`\`${raw}\`\n\n\`\`\`text\n${raw}\n\`\`\``),
  ).toEqual([]);
  expect(
    agentMentionReferences(
      `agent:ff; agent:7; agent:00; https://example.com/${raw}`,
    ),
  ).toEqual([]);
});

it("retains source positions when Markdown preview turns a bare token into a badge", () => {
  const value = "Before\nagent:7265766965776572; after";
  const child = {
    type: "text",
    value,
    position: {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: value.length, line: 2, column: 28 },
    },
  };
  const tree = { type: "root", children: [child] };
  const extension = transcriptLinks().markdown.extensions.find(
    (extension) => extension.name === "lapis-agent-mentions",
  )!;
  const plugin = extension.remarkPlugins![0] as () => (
    tree: unknown,
    file: unknown,
  ) => void;
  plugin()(tree, { value });
  expect(tree.children[1]).toMatchObject({
    type: "link",
    data: { hName: "chatagent" },
    position: {
      start: { offset: 7, line: 2, column: 1 },
      end: { offset: 30, line: 2, column: 24 },
    },
  });
  expect(tree.children[2]!.position.start.offset).toBe(30);
  const untouched = {
    type: "text",
    value: "Normal Markdown",
    position: child.position,
  };
  const plain = { type: "root", children: [untouched] };
  plugin()(plain, { value: untouched.value });
  expect(plain.children[0]).toBe(untouched);
});

it("decorates each Markdown link once, retaining its captured label and identity", () => {
  const text = `${formatAgentMention("removed-profile", "Nyra")} hello`;
  const state = EditorState.create({
    doc: text,
    selection: { anchor: text.length },
    extensions: createMiraMarkdownLanguage(),
  });
  expect(composerReferenceRanges(state, [])).toEqual([
    expect.objectContaining({
      from: 0,
      to: text.indexOf(" hello"),
      identityId: "removed-profile",
      label: "Nyra",
      kind: "agent",
    }),
  ]);
});

it("deduplicates and removes the complete inline link while retaining surrounding prose", () => {
  const option = { id: "reviewer", label: "Nyra", agent: "codex" as const };
  const recipients = new ComposerRecipients(() => [option]);
  const composer = {
    draft: "Before ",
    recipientOptions: [option],
    recipients,
    insertReference(value: string) {
      this.draft += `${value} `;
    },
  };
  appendInlineRecipient(composer, option.id);
  appendInlineRecipient(composer, option.id);
  composer.draft += "after";
  expect(composer.draft).toBe(
    `Before ${formatAgentMention(option.id, option.label)} after`,
  );
  removeInlineRecipient(composer, option.id);
  expect(composer.draft).toBe("Before after");
});
