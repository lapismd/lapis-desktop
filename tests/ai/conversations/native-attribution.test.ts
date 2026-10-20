import { expect, it } from "vitest";
import { CanonicalConversationCatalog } from "../../../src/lib/ai/conversations/canonical-catalog.ts";
import { NativeSessionRecords } from "../../../src/lib/ai/conversations/native-session-records.ts";
import { projectNativeSession } from "../../../src/lib/ai/chat/native-session-projection.ts";
import { nativeReaderPort } from "../../../catalog/support/ai/native/port.ts";
import { owner, id } from "../../../catalog/support/ai/native/facts.ts";
import { agentReviewProfiles } from "../../../catalog/support/ai/transcript/agent-profiles.ts";

it("uses committed agent attribution and exact human revisions while resolving avatars from local profiles", async () => {
  const native = nativeReaderPort("managed"),
    catalog = new CanonicalConversationCatalog(native.port, native.opened);
  await catalog.refresh();
  const lease = (await catalog.openRead(owner.threadId))!;
  const records = new NativeSessionRecords(
    lease,
    lease.read.recordSources[0]!.cursor,
  );
  await records.loadAll();
  const profiles = agentReviewProfiles.map((v) => ({
    ...v,
    label: "Renamed local profile",
  }));
  const items = projectNativeSession(records, {
    conversation: lease.read.view,
    profiles,
  });
  const assistant = items.find((v) => v.role === "assistant")!;
  const user = items.find((v) => v.role === "user")!;
  expect(assistant.author).toMatchObject({
    id: id(10),
    name: "Migration reviewer",
    image: profiles[0]!.avatar,
    background: profiles[0]!.avatarBackground,
  });
  expect(user.author).toMatchObject({
    id: `native/session/${id(10)}/captured-user`,
    name: "Captured user",
  });
  expect(assistant.turn?.id).toBe(
    `native/thread/${owner.threadId}/message/${id(3)}`,
  );
  expect(assistant.turn?.prompt).toBe(lease.read.view.messages[0]!.body);
  expect(user.id).toContain(id(101));
  expect(user.id).not.toBe(assistant.turn?.id);
  // A newer authored revision with identical text cannot acquire the old turn.
  const changed = structuredClone(lease.read.view);
  changed.messages[0]!.reference.id = "f".repeat(64);
  const separate = projectNativeSession(records, {
    conversation: changed,
    profiles,
  });
  expect(separate.find((v) => v.role === "assistant")?.turn?.id).toBe(user.id);
  const withoutLocalProfile = projectNativeSession(records, {
    conversation: lease.read.view,
  });
  expect(
    withoutLocalProfile.find((v) => v.role === "assistant")?.author?.name,
  ).toBe("Migration reviewer");
  expect(
    withoutLocalProfile.find((v) => v.role === "assistant")?.author?.image,
  ).not.toBe(profiles[0]!.avatar);
  await lease.close();
  await catalog.close();
});
