// SPDX-License-Identifier: Apache-2.0
import type { CreateConversationInput } from "./conversation-repository.ts";
import type { ConversationMetadata } from "./types.ts";
import { CONVERSATION_SCHEMA_VERSION } from "./types.ts";
import {
  normalizePortableVaultPath,
  relativePathWithinScope,
} from "./paths.ts";
export function createMetadata(
  input: CreateConversationInput,
  conversationId: string,
): ConversationMetadata {
  const now = input.now ?? new Date().toISOString();
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id: conversationId,
    createdAt: now,
    updatedAt: now,
    status: "active",
    ...(input.launchNotePath
      ? {
          launchContext: {
            notePath: relativePathWithinScope(
              input.scopeDir,
              input.launchNotePath,
            ),
          },
        }
      : {}),
    ...(input.workspacePath
      ? {
          workspace: {
            path: normalizePortableVaultPath(input.workspacePath, {
              allowRoot: true,
              label: "Workspace reference",
            }),
          },
        }
      : {}),
  };
}
