import { expect, it, vi } from "vitest";
import {
  automaticApprovalOption,
  effectiveApprovalPolicy,
} from "../../../src/lib/ai/core/approval-policy.ts";
import { mergeAiSettings } from "../../../src/lib/ai/settings/ai-settings.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { recipientFromOption } from "../../../src/lib/ai/conversations/recipients.ts";
import {
  aiSettingPatch,
  readAiSetting,
} from "../../../src/lib/ai/settings/setting-values.ts";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";

it("defaults to asking and only admits the two supported policies", () => {
  expect(mergeAiSettings(null).approvalPolicy).toBe("ask");
  expect(
    mergeAiSettings({ approvalPolicy: "unknown" as never }).approvalPolicy,
  ).toBe("ask");
  const registry = new AppToolRegistry(),
    settings = mergeAiSettings(null);
  expect(readAiSetting(settings, "ai.approvalPolicy", registry)).toBe("ask");
  expect(
    aiSettingPatch(settings, "ai.approvalPolicy", "allow-all", registry),
  ).toEqual({ approvalPolicy: "allow-all" });
  expect(() =>
    aiSettingPatch(settings, "ai.approvalPolicy", "unrestricted", registry),
  ).toThrow();
  expect(() =>
    mergeAiSettings({
      agentParticipants: [
        {
          id: "one",
          label: "One",
          agent: "codex",
          approvalPolicy: "unrestricted" as never,
        },
      ],
    }),
  ).toThrow();
});
it("persists global policy and explicit agent inheritance/overrides separately from execution mode", async () => {
  let saved: unknown;
  const store = new AiSettingsStore(async (data) => {
    saved = structuredClone(data);
  });
  const inherited = {
    id: "inherited",
    label: "Inherited",
    agent: "codex" as const,
  };
  const reviewer = {
    id: "reviewer",
    label: "Reviewer",
    agent: "opencode" as const,
    approvalPolicy: "ask" as const,
    executionMode: "build",
  };
  const auto = {
    id: "auto",
    label: "Automatic",
    agent: "cursor" as const,
    approvalPolicy: "allow-all" as const,
    executionMode: "plan",
  };
  await store.update({
    approvalPolicy: "allow-all",
    agentParticipants: [inherited, reviewer, auto],
  });
  const cold = new AiSettingsStore(async () => {
    throw new Error("Restore cannot write");
  });
  cold.hydrate(saved);
  expect(cold.get()).toEqual(store.get());
  const policy = (p: typeof inherited | typeof reviewer | typeof auto) =>
    effectiveApprovalPolicy(cold.get(), {
      agent: p.agent,
      recipients: [recipientFromOption(p)],
    });
  expect(policy(inherited)).toBe("allow-all");
  expect(policy(reviewer)).toBe("ask");
  expect(policy(auto)).toBe("allow-all");
  expect(
    effectiveApprovalPolicy(cold.get(), {
      agent: "cursor",
      recipients: [recipientFromOption(reviewer)],
    }),
  ).toBe("ask");
  expect(
    effectiveApprovalPolicy(cold.get(), { agent: "codex", restricted: true }),
  ).toBe("ask");
  expect(
    effectiveApprovalPolicy(cold.get(), {
      agent: "codex",
      recipients: [recipientFromOption({ ...inherited, id: "removed" })],
    }),
  ).toBe("ask");
  expect(cold.get().agentParticipants![1]!.executionMode).toBe("build");
});
it("does not publish a weaker policy after a failed save", async () => {
  const listener = vi.fn();
  const store = new AiSettingsStore(async () => {
    throw new Error("Disk full");
  });
  store.subscribe(listener);
  await expect(store.update({ approvalPolicy: "allow-all" })).rejects.toThrow(
    "Disk full",
  );
  expect(store.get().approvalPolicy).toBe("ask");
  expect(listener).not.toHaveBeenCalled();
});
it("rejects ambiguous options and unknown kinds regardless of labels and IDs", () => {
  const option = { id: "allow", kind: "allow-once" as const, label: "Allow" };
  const request = {
    id: "request",
    title: "Read",
    kind: "read" as const,
    options: [option],
  };
  expect(automaticApprovalOption("allow-all", request)).toBe("allow");
  expect(
    automaticApprovalOption("allow-all", { ...request, kind: "other" }),
  ).toBeUndefined();
  expect(
    automaticApprovalOption("allow-all", {
      ...request,
      options: [option, option],
    }),
  ).toBeUndefined();
  expect(
    automaticApprovalOption("allow-all", {
      ...request,
      options: [option, { ...option, id: "other" }],
    }),
  ).toBeUndefined();
  expect(automaticApprovalOption("ask", request)).toBeUndefined();
});
