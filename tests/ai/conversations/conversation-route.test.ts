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

it("ignores retired native routes without treating their identifiers as local files", () => {
  expect(conversationRouteFromState({ conversationRoute: native })).toBeNull();
  expect(() => conversationRoute(native)).toThrow(/route/);
  expect(
    stateWithConversationRoute({ conversationRoute: native }, null),
  ).toEqual({});
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

it("never interprets obsolete native IDs as a file route, even with legacy fields", () => {
  for (const state of [
    { ...location, conversationRoute: native },
    { conversationRoute: { ...native, version: 2 } },
  ])
    expect(conversationRouteFromState(state)).toBeNull();
  for (const state of [
    { conversationRoute: { ...native, backend: "automatic" } },
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

it("does not alias local file scopes when matching panes", () => {
  const file = {
    version: 1 as const,
    backend: "vault-files" as const,
    location,
  };
  expect(sameConversationRoute(file, structuredClone(file))).toBe(true);
  expect(
    sameConversationRoute(file, {
      ...file,
      location: { ...location, scopeDir: "Other" },
    }),
  ).toBe(false);
  expect(sameConversationRoute(null, null)).toBe(true);
});
