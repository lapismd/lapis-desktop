import {
  ownedAiHistory,
  type AiHistoryBinding,
  type AiTurnOutcome,
  type AiTurnRecord,
} from "../../repository/ai-history.ts";
import type { App } from "@lapis-notes/api";
import type { ConversationRepository } from "../conversations/conversation-repository.ts";
import {
  CONVERSATION_SCHEMA_VERSION,
  type ConversationLocation,
} from "../conversations/types.ts";
import type { AgentRequest, AgentSession } from "../core/runtime.ts";

export type HistoryObservation = {
  record: AiTurnRecord;
  location: ConversationLocation;
  binding: AiHistoryBinding;
  settled?: Promise<void>;
};
/** Durable native boundaries augment ordinary file-backed ACP conversations. */
export class AiFileHistory {
  records = $state.raw<AiTurnRecord[]>([]);
  pending = $state<{
    message: string;
    choose(value: "retry" | "continue" | "cancel"): void;
  }>();
  readonly #sessions = new WeakMap<AgentSession, HistoryObservation>();
  #generation = 0;
  #conversation?: string;
  #app?: App;
  #repository?: ConversationRepository;
  #binding?: () => AiHistoryBinding | undefined;
  configure(
    app?: App,
    repository?: ConversationRepository,
    binding?: () => AiHistoryBinding | undefined,
  ) {
    this.#app = app;
    this.#repository = repository;
    this.#binding = binding ?? (() => ownedAiHistory(app));
  }
  get binding() {
    return this.#binding?.();
  }
  cancelPending() {
    this.pending?.choose("cancel");
  }
  report(error: unknown) {
    this.#app?.notifications.notify({
      id: "ai-file-history",
      source: "ai",
      title: "AI change history",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
  async #retain(record: AiTurnRecord, location: ConversationLocation) {
    if (this.#repository)
      await this.#repository.appendAgentRecords(location, [
        {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          type: "history.turn.recorded",
          id: `history-${record.context.turn}-${record.phase}-${record.context.binding ?? "preparing"}`,
          createdAt: new Date(
            record.ended_at ?? record.started_at,
          ).toISOString(),
          history: record,
        },
      ]);
    if (
      this.#conversation &&
      this.#conversation !== record.context.conversation
    )
      return;
    if (
      this.records.some(
        (r) => r.context.conversation !== record.context.conversation,
      )
    )
      return;
    this.records = [
      ...this.records.filter((r) => r.context.turn !== record.context.turn),
      record,
    ];
  }
  async load(location: ConversationLocation | null) {
    const generation = ++this.#generation;
    this.#conversation = location?.conversationId;
    this.records = [];
    if (!location || !this.#repository) return;
    const snapshot = await this.#repository.read(location);
    if (generation !== this.#generation) return;
    const records = new Map<string, AiTurnRecord>();
    for (const entry of snapshot.agents)
      if (
        entry.type === "history.turn.recorded" &&
        entry.history.context.conversation === location.conversationId
      )
        records.set(entry.history.context.turn, entry.history);
    this.records = [...records.values()];
    const binding = this.binding;
    if (!binding?.enabled()) return;
    // Native receipts recover an acknowledgement lost before transcript linkage.
    let cursor: string | undefined;
    try {
      do {
        const page = await binding.service.list(
          location.conversationId,
          cursor,
        );
        if (generation !== this.#generation) return;
        for (const record of page.records) {
          if (
            JSON.stringify(records.get(record.context.turn)) !==
            JSON.stringify(record)
          ) {
            await this.#retain(record, location);
            records.set(record.context.turn, record);
          }
        }
        cursor = page.next ?? undefined;
      } while (cursor);
    } catch (error) {
      if (generation === this.#generation) this.report(error);
    }
  }
  async begin(
    location: ConversationLocation | null,
    message: string,
    request: Omit<AgentRequest, "prompt">,
  ): Promise<HistoryObservation | undefined> {
    const binding = this.binding;
    if (!location || !binding?.enabled()) return;
    this.#conversation ??= location.conversationId;
    const context = {
      conversation: location.conversationId,
      turn: crypto.randomUUID(),
      message,
      binding: null,
      session: null,
      agent:
        request.recipients?.[0]?.id ??
        request.agentProfile?.name ??
        request.agent ??
        "Agent",
      harness: request.agent ?? "local",
      requested_model: request.model?.model ?? null,
      resolved_model: null,
    };
    while (true) {
      let prepared: AiTurnRecord | undefined;
      try {
        const record = await binding.service.begin(context);
        prepared = record;
        if (record.phase !== "running")
          throw new Error(
            "This turn's history preparation was interrupted. Start a new turn.",
          );
        await this.#retain(record, location);
        return { record, location: { ...location }, binding };
      } catch (error) {
        // A lost begin acknowledgement may already have a durable baseline.
        // Resolve that same identity before offering a new preparation attempt.
        if (!prepared) {
          try {
            const saved = await binding.service.read(
              context.conversation,
              context.turn,
            );
            if (saved.phase === "running") {
              prepared = await binding.service.begin(context);
              await this.#retain(prepared, location);
              return { record: prepared, location: { ...location }, binding };
            }
          } catch {
            /* no confirmed admission; keep the prompt pending */
          }
        }
        this.report(error);
        if (prepared) {
          try {
            prepared = await binding.service.end(
              context.conversation,
              context.turn,
              "failed",
            );
          } catch (error) {
            this.report(error);
          }
        }
        const decision = await new Promise<"retry" | "continue" | "cancel">(
          (resolve) => {
            this.pending = {
              message: error instanceof Error ? error.message : String(error),
              choose: resolve,
            };
          },
        );
        this.pending = undefined;
        if (decision === "retry") {
          if (prepared && prepared.phase !== "running")
            context.turn = crypto.randomUUID();
          continue;
        }
        if (decision === "continue") {
          if (!prepared)
            await binding.service
              .end(context.conversation, context.turn, "unknown")
              .catch(() => {});
          return;
        }
        throw new DOMException(
          "History preparation cancelled. Your prompt is retained.",
          "AbortError",
        );
      }
    }
  }
  async attach(
    session: AgentSession,
    observation: HistoryObservation,
    bindingId?: string,
  ) {
    this.#sessions.set(session, observation);
    observation.record = await observation.binding.service.bind({
      ...observation.record.context,
      binding: bindingId ?? null,
      session: session.id,
    });
    await this.#retain(observation.record, observation.location);
  }
  async finish(session: AgentSession, outcome: AiTurnOutcome) {
    const observation = this.#sessions.get(session);
    if (observation) await this.finishObservation(observation, outcome);
  }
  async finishObservation(
    observation: HistoryObservation,
    outcome: AiTurnOutcome,
  ) {
    return (observation.settled ??= (async () => {
      try {
        const record = await observation.binding.service.end(
          observation.record.context.conversation,
          observation.record.context.turn,
          outcome,
        );
        observation.record = record;
        await this.#retain(record, observation.location);
      } catch (error) {
        // Do not invent an end pin or turn success after a lost capture outcome.
        this.report(error);
        try {
          const record = await observation.binding.service.read(
            observation.record.context.conversation,
            observation.record.context.turn,
          );
          await this.#retain(record, observation.location);
        } catch {
          /* native receipt remains the recovery authority */
        }
      }
    })());
  }
}
