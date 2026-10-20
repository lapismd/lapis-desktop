import { owner, id, ref, uuid } from "./facts.ts";
import type { nativeData } from "./data.ts";

/** Simulated native projection; native graph/receipt proof has separate tests. */
export function managedNativeData(data: ReturnType<typeof nativeData>) {
  const requestId = uuid(90);
  const pages = new Map(
    [...data.pages].map(([cursor, text]) => {
      const page = JSON.parse(text);
      if (page.session_id === id(10)) {
        const record = page.records.find(
          (r: { reference: { kind: string } }) =>
            r.reference.kind === "observation_batch",
        );
        record.projection.value.desktop = {
          schema: 1,
          repository: owner.repository,
          threadId: owner.threadId,
          worker: uuid(91),
          requestId,
          clientId: "codex",
          participant: {
            profileId: "reviewer",
            label: "Migration reviewer",
            preferredModel: "gpt-5.6-sol",
            preferredEffort: "high",
          },
          authored: {
            requestId: requestId.replaceAll("-", ""),
            messageId: id(3),
            actor: id(9),
            revision: ref("human_message_revision", 3),
            threadVersion: ref("thread_version", 5),
          },
        };
        record.projection.value.observations[0].source_kind = "native_api";
        record.projection.value.observations[0].source_trust =
          "locally_trusted_plugin";
      }
      return [cursor, JSON.stringify(page)] as const;
    }),
  );
  return { ...data, pages };
}
