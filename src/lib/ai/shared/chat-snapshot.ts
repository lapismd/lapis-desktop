import { parseDraft } from "../drafts/model.ts";
import type { AgentSnapshot, AgentRequest } from "@lapismd/agent-ui/core";
import type {
  TranscriptItem,
  TranscriptQueuedMessage,
} from "@lapismd/design-core/chat";
import type { TranscriptPanelProps } from "../chat/panel/transcript.ts";
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import { persistableCommentContexts } from "../conversations/comment-context.ts";
import { conversationKey } from "./chat-port.ts";
export function desktopChatSnapshot(
  panel: TranscriptPanelProps,
  rows: ConversationListEntry[],
  items: readonly TranscriptItem[],
): AgentSnapshot {
  const {
    controller: host,
    composerState: composer,
    attachmentsState: attachments,
    panelProps,
  } = panel;
  const current = host.location
    ? conversationKey(host.location)
    : "new-session";
  const entries = rows.map((row) => ({
    id: conversationKey(row.location),
    title: row.metadata?.title ?? "Untitled conversation",
    agent: composer.selectedAgent,
    updatedAt: row.metadata?.updatedAt ?? "",
    status:
      row.metadata?.status === "archived"
        ? ("archived" as const)
        : ("active" as const),
    items: conversationKey(row.location) === current ? [...items] : [],
    scope: row.location.scopeDir,
    path: row.metadata?.launchContext?.notePath,
    profile: "Local chat",
  }));
  if (!entries.some((row) => row.id === current))
    entries.unshift({
      id: current,
      title: "New conversation",
      agent: composer.selectedAgent,
      updatedAt: "",
      status: "active",
      items: [...items],
      scope: host.location?.scopeDir ?? host.directoryContext,
      path: undefined,
      profile: "Local chat",
    });
  const pending = host.items.filter(
    (item) =>
      (item.type === "approval" || item.type === "question") &&
      item.status === "pending",
  );
  const queued: TranscriptQueuedMessage[] = host.queuedMessages.entries
    .filter((e) => e.pending && e.state !== "working")
    .map((e) => ({
      id: e.queued.id,
      submission: {
        id: e.queued.id,
        text: e.queued.user.text,
        comments: persistableCommentContexts(
          e.queued.user.contextBlocks,
        ).flatMap((b) => JSON.parse(b.content).comments),
      },
      recipients: [
        {
          id: e.queued.id,
          label: e.queued.user.recipients?.map((r) => r.label).join(", ") ?? "",
          state: e.state === "queued" ? "queued" : "unknown",
        },
      ],
    }));
  const snapshot: AgentSnapshot = {
    sessions: entries.sort(
      (a, b) => Number(b.id === current) - Number(a.id === current),
    ),
    agents: composer.recipientOptions.map((option) => ({
      id: option.id,
      name: option.label,
      model: option.model ?? composer.selectedModel,
      provider: option.agent,
      description: option.description ?? "",
      enabled: true,
      profile: option,
    })),
    catalog: [],
    imports: [],
    requests: pending.flatMap<AgentRequest>((item) =>
      item.type === "approval"
        ? [
            {
              id: item.request.id,
              session: current,
              kind: "approval" as const,
              title: item.request.title,
              details: "",
              options: item.request.options,
              approval: item.request,
            },
          ]
        : item.type === "question"
          ? [
              {
                id: item.request.id,
                session: current,
                kind: "question" as const,
                title: item.request.title ?? "Question",
                details: "",
                options: [],
                question: item.request,
              },
            ]
          : [],
    ),
    requestResults: Object.fromEntries(
      host.items.flatMap<
        [string, NonNullable<AgentSnapshot["requestResults"]>[string]]
      >((item) =>
        item.type === "approval" && item.status !== "pending"
          ? [
              [
                `${item.id}/body`,
                {
                  kind: "approval",
                  request: item.request,
                  selectedOptionId: item.responseOptionId,
                  state: {
                    status: item.status === "rejected" ? "denied" : item.status,
                  },
                },
              ],
            ]
          : item.type === "question" && item.status !== "pending"
            ? [
                [
                  `${item.id}/body`,
                  {
                    kind: "question",
                    request: item.request,
                    state: { status: item.status },
                  },
                ],
              ]
            : [],
      ),
    ),
    queued,
    queueState: {
      paused: host.queuedMessages.paused,
      saving: host.queuedMessages.saving,
      running: host.queuedMessages.running,
      resuming: host.queuedMessages.resuming,
    },
    busy: host.busy,
    capabilities: [
      "send",
      "stop",
      "respond",
      "new_session",
      "archive",
      "chat_settings",
      "change_scope",
      "cancel_queued",
      "resume_queue",
      "pause_queue",
    ],
    chat: {
      scope: host.location?.scopeDir ?? host.directoryContext,
      scopes: panel.conversationsState.scopeFolders,
      files: attachments.attachItems,
      usage: host.usage ?? undefined,
      approvalPolicy: panelProps.settings?.approvalPolicy,
      automaticallyMentionAgents: composer.automaticallyMentionAgents,
      draft: {
        text: composer.draft,
        attachments: attachments.attachments.map((f) => f.path),
        threads: parseDraft({
          text: composer.draft,
          attachments: attachments.attachments,
          threads: composer.draftThreads,
        }).threads,
      },
    },
  };
  return snapshot;
}
