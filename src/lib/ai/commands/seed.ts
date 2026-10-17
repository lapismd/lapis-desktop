// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
import {
  reservedCommandMarkdown,
  RESERVED_SLASH_COMMANDS,
} from "./reserved.ts";
import type { UserAgentsCommandStore } from "./user-agents.ts";

export async function seedReservedCommands(
  store: UserAgentsCommandStore,
  options: { overwrite?: boolean } = {},
): Promise<void> {
  for (const command of RESERVED_SLASH_COMMANDS) {
    if (!options.overwrite && (await store.exists(command.name))) continue;
    await store.write(command.name, reservedCommandMarkdown(command));
  }
}
