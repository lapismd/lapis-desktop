// SPDX-License-Identifier: Apache-2.0
import type { TranscriptItem } from "@lapismd/design-core/chat";
import { projectAiTranscript } from "./transcript-projection.ts";
import { previewTranscriptTool } from "./transcript-tool-preview.ts";
import type { NativeLiveSession } from "./native-live-session.ts";
import type { AgentRecipientOption } from "../conversations/recipients.ts";
import { agentAvatar } from "../presentation/agent-avatar.ts";

export function projectNativeLive(
  sessions: Iterable<NativeLiveSession>,
  profiles: readonly AgentRecipientOption[],
): TranscriptItem[] {
  return [...sessions].flatMap((live) => {
    const participant = live.delivery.participant;
    const profile = profiles.find(
      (value) => value.id === participant?.profileId,
    );
    return projectAiTranscript(live.items).map((item) => ({
      ...item,
      author:
        item.role === "assistant"
          ? {
              id: live.delivery.id,
              name: participant?.label ?? "Codex",
              image: profile?.avatar ?? agentAvatar("codex"),
              background: profile?.avatarBackground,
              shape: "rounded" as const,
            }
          : item.author,
      blocks: item.blocks.map((block) => ({ ...block, commentable: false })),
      tools: item.tools?.map((tool) => {
        const original = live.items.find((value) => value.id === tool.id);
        return original?.type === "tool"
          ? {
              ...previewTranscriptTool(tool, original, false),
              commentable: false,
            }
          : tool;
      }),
    }));
  });
}
