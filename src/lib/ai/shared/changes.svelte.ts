import type { TranscriptItem } from "@lapismd/design-core/chat";
import { historyTranscript } from "../chat/history-transcript.ts";
import { onDestroy } from "svelte";
import { AgentChangesController } from "@lapismd/agent-ui/chat";
import type { AgentChangesPort, AgentTurnRecord } from "@lapismd/agent-ui/chat";
import type { TranscriptPanelProps } from "../chat/panel/transcript.ts";
import {
  readTurnComparison,
  readTurnFile,
} from "../chat/history-comparison.ts";
import { diffText } from "../../repository/history-state.ts";
/** Native operation identities and undo guards remain outside the shared presentation. */
export function sharedChanges(
  panel: () => TranscriptPanelProps,
  items: () => readonly TranscriptItem[],
) {
  const history = panel().controller.fileHistory;
  const original = (record: AgentTurnRecord) => {
    const exact = history.records.find(
      (r) =>
        r.context.conversation === record.context.conversation &&
        r.context.turn === record.context.turn &&
        r.before.commit === record.before.commit &&
        r.after?.commit === record.after?.commit,
    );
    if (!exact || !history.binding)
      throw new Error("The recorded comparison is unavailable.");
    return { record: exact, binding: history.binding };
  };
  const port: AgentChangesPort = {
    async compare(record) {
      const exact = original(record),
        result = await readTurnComparison(exact.binding, exact.record);
      return {
        ...result,
        files: result.files.map((f) => ({
          ...f,
          diff: f.diff
            ? { path: f.path, content: diffText(f.diff) }
            : undefined,
        })),
      };
    },
    async readFile(record, path) {
      const exact = original(record),
        file = await readTurnFile(exact.binding, exact.record, path);
      return { path, content: diffText(file) };
    },
    async previewUndo(record, paths) {
      const exact = original(record);
      const result = await exact.binding.guard(() =>
        exact.binding.service.previewUndo(
          record.context.conversation,
          record.context.turn,
          [...paths],
        ),
      );
      return {
        paths: result.paths,
        checkpoint: result.expected,
        request_id: crypto.randomUUID(),
        conversation: record.context.conversation,
        turn: record.context.turn,
      };
    },
    async undo(request) {
      const binding = history.binding;
      if (!binding) throw new Error("History is unavailable.");
      await binding.guard(() =>
        binding.service.undo({
          request_id: request.request_id,
          conversation: request.conversation,
          turn: request.turn,
          paths: [...request.paths],
          expected: request.checkpoint,
        }),
      );
    },
    report: (error) => history.report(error),
    copyText: (value) => navigator.clipboard.writeText(value),
  };
  const presentation = {
    get records() {
      const merged = historyTranscript(
          items(),
          history.records,
          panel().controller.items,
        ),
        anchors = new Map<string, string>();
      let previous = "";
      for (const item of merged) {
        if (item.id.startsWith("history/"))
          anchors.set(item.id.slice(8), previous);
        else previous = item.id;
      }
      return history.records.map((record) => ({
        context: {
          conversation: record.context.conversation,
          turn: record.context.turn,
          message: record.context.message ?? "",
          agent: record.context.agent,
          requested_model: record.context.requested_model ?? undefined,
        },
        phase: record.phase,
        before: record.before,
        after: record.after ?? undefined,
        started_at: record.started_at,
        afterItemId: anchors.get(record.context.turn),
      }));
    },
    get pending() {
      return history.pending;
    },
    cancelPending: () => history.cancelPending(),
    report: (error: unknown) => history.report(error),
  };
  const inspection = new AgentChangesController(presentation, port);
  $effect(() => {
    const location = panel().controller.location;
    let disposed = false;
    inspection.reset();
    void history
      .load(location)
      .then(async () => {
        const binding = history.binding;
        if (!location || disposed || !binding?.enabled()) return;
        const pending = await binding.service.pendingUndo();
        if (!disposed) {
          const request = pending.find(
            (r) => r.conversation === location.conversationId,
          );
          inspection.undo = request
            ? {
                request_id: request.request_id,
                conversation: request.conversation,
                turn: request.turn,
                paths: [...request.paths],
                checkpoint: request.expected,
              }
            : undefined;
          inspection.recoveringUndo = !!inspection.undo;
        }
      })
      .catch((error) => history.report(error));
    return () => {
      disposed = true;
    };
  });
  onDestroy(() => {
    inspection.dispose();
  });
  return inspection;
}
