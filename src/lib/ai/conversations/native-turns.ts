// SPDX-License-Identifier: Apache-2.0
import { ManagedConversationTurn } from "./managed-turn.ts";
import type {
  CanonicalConversationRead,
  ConversationBackendPort,
  OpenedConversationBackend,
} from "./backend-port.ts";
import type {
  ManagedAgentLauncher,
  ManagedTurnRecipient,
} from "./managed-turn-types.ts";
import type { NativeConversationWorkspace } from "./native-workspace.ts";

/** Turns retain the exact backend owner until their supervised Stop has completed. */
export class NativeConversationTurns {
  readonly #turns = new Set<ManagedConversationTurn>();
  #closed = false;
  constructor(
    private readonly port: ConversationBackendPort | undefined,
    private readonly launcher: ManagedAgentLauncher | undefined,
    private readonly workspace: NativeConversationWorkspace,
  ) {}
  create(
    opened: OpenedConversationBackend,
    read: CanonicalConversationRead,
    text: string,
    recipients: readonly ManagedTurnRecipient[],
  ) {
    if (this.#closed || !this.port || !this.launcher)
      throw new Error("Native conversation execution is unavailable");
    const release = this.workspace.retainTurn(opened);
    let turn: ManagedConversationTurn;
    try {
      turn = new ManagedConversationTurn(
        this.port,
        opened,
        this.launcher,
        read,
        text,
        recipients,
      );
    } catch (error) {
      release();
      throw error;
    }
    this.#turns.add(turn);
    const unsubscribe = turn.subscribe((state) => {
      if (state.phase === "closed") {
        this.#turns.delete(turn);
        release();
        unsubscribe();
      }
    });
    return turn;
  }
  async close() {
    this.#closed = true;
    const results = await Promise.allSettled(
      [...this.#turns].map((turn) => turn.close()),
    );
    const errors = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (errors.length)
      throw new AggregateError(errors, "Native conversation cleanup failed");
  }
}
