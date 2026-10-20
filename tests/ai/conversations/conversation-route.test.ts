import { expect, it } from "vitest";
import {
  conversationRoute,
  conversationRouteFromState,
  sameConversationRoute,
  stateWithConversationRoute,
} from "../../../src/lib/ai/conversations/conversation-route.ts";

const location = {
  scopeDir: "Notes/研究",
  conversationId: "123e4567-e89b-42d3-a456-426614174000",
};
const native = {
  version: 1 as const,
  backend: "jj" as const,
  conversation: {
    target: {
      type: "conversation" as const,
      id: "external:opaque conversation/研究",
    },
    threadId: "a".repeat(32),
    repository: "b".repeat(32),
  },
};

it("preserves opaque native identity without synthesizing a file location or UUID", () => {
  const state = stateWithConversationRoute(
    { label: "AI", ...location },
    native,
  );
  expect(state).toEqual({ label: "AI", conversationRoute: native });
  expect(conversationRouteFromState(JSON.parse(JSON.stringify(state)))).toEqual(
    native,
  );
  expect(state).not.toHaveProperty("scopeDir");
  expect(state).not.toHaveProperty("conversationId");
  const recorded = {
    ...native,
    conversation: {
      ...native.conversation,
      target: { type: "recorded" as const, session: "c".repeat(32) },
    },
  };
  expect(conversationRoute(recorded)).toEqual(recorded);
});

it("retains explicit file routes and reads legacy state only as a file reference", () => {
  const file = {
    version: 1 as const,
    backend: "vault-files" as const,
    location,
  };
  expect(conversationRouteFromState(location)).toEqual(file);
  expect(
    conversationRouteFromState(stateWithConversationRoute({}, file)),
  ).toEqual(file);
  expect(
    stateWithConversationRoute(
      { title: "AI", ...location, conversationRoute: file },
      null,
    ),
  ).toEqual({ title: "AI" });
  expect(conversationRouteFromState({ title: "New conversation" })).toBeNull();
});

it("never falls through a malformed or ambiguous native route into legacy state", () => {
  for (const state of [
    { ...location, conversationRoute: native },
    { conversationRoute: { ...native, version: 2 } },
    { conversationRoute: { ...native, backend: "automatic" } },
    {
      conversationRoute: {
        ...native,
        conversation: { ...native.conversation, repository: null },
      },
    },
    { scopeDir: "Notes" },
    { conversationId: location.conversationId },
  ])
    expect(() => conversationRouteFromState(state)).toThrow();
});

it("rejects handles, selections, content and other authority in persisted routes", () => {
  for (const key of [
    "root",
    "handle",
    "selection",
    "snapshot",
    "actor",
    "generation",
    "backendHandle",
  ]) {
    expect(() => conversationRoute({ ...native, [key]: "forbidden" })).toThrow(
      /route/,
    );
    expect(() =>
      conversationRoute({
        ...native,
        conversation: { ...native.conversation, [key]: "forbidden" },
      }),
    ).toThrow(/route/);
  }
  for (const target of [
    { type: "conversation", id: "" },
    { type: "conversation", id: "x\0y" },
    { type: "conversation", id: "😀".repeat(129) },
    { type: "recorded", session: location.conversationId },
    { type: "conversation", id: "opaque", session: "c".repeat(32) },
  ])
    expect(() =>
      conversationRoute({
        ...native,
        conversation: { ...native.conversation, target },
      }),
    ).toThrow(/route/);
});

it("does not alias repositories, target kinds or file scopes when matching panes", () => {
  expect(sameConversationRoute(native, structuredClone(native))).toBe(true);
  expect(
    sameConversationRoute(native, {
      ...native,
      conversation: { ...native.conversation, repository: "d".repeat(32) },
    }),
  ).toBe(false);
  expect(
    sameConversationRoute(native, {
      ...native,
      conversation: {
        ...native.conversation,
        target: { type: "recorded", session: "a".repeat(32) },
      },
    }),
  ).toBe(false);
  const file = {
    version: 1 as const,
    backend: "vault-files" as const,
    location,
  };
  expect(sameConversationRoute(native, file)).toBe(false);
  expect(
    sameConversationRoute(file, {
      ...file,
      location: { ...location, scopeDir: "Other" },
    }),
  ).toBe(false);
  expect(sameConversationRoute(null, null)).toBe(true);
});
