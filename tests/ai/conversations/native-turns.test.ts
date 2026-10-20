import { expect, it } from "vitest";
import { NativeConversationWorkspace } from "../../../src/lib/ai/conversations/native-workspace.ts";
import { NativeConversationTurns } from "../../../src/lib/ai/conversations/native-turns.ts";
import { managedTurnFixture } from "./managed-turn-fixture.ts";

it("releases the backend retention if construction refuses an invalid turn", async () => {
  const f = await managedTurnFixture();
  const workspace = new NativeConversationWorkspace(f.native.port, () => {});
  await workspace.open();
  const turns = new NativeConversationTurns(
    f.native.port,
    f.launcher,
    workspace,
  );
  expect(() =>
    turns.create(f.native.opened, f.read, "invalid\0message", f.recipients),
  ).toThrow();
  expect(f.launcher.start).not.toHaveBeenCalled();
  const changed = await workspace.changeStorage(
    async () => "released idle owner",
  );
  expect(changed).toBe("released idle owner");
  await turns.close();
  await workspace.close();
});

it("retains the exact backend through a failed supervised turn close and releases only on retry", async () => {
  const f = await managedTurnFixture();
  const workspace = new NativeConversationWorkspace(f.native.port, () => {});
  const pane = await workspace.acquireReader();
  const turns = new NativeConversationTurns(
    f.native.port,
    f.launcher,
    workspace,
  );
  const turn = turns.create(
    pane.opened,
    f.read,
    "Keep the authored text unchanged",
    f.recipients,
  );
  await turn.send();
  await pane.close();
  await expect(workspace.changeStorage(async () => {})).rejects.toThrow(
    /Close native/,
  );
  f.launcher.releaseStopped.mockRejectedValueOnce(
    new Error("Local stream release unknown"),
  );
  await expect(turns.close()).rejects.toThrow(/cleanup failed/);
  await expect(workspace.changeStorage(async () => {})).rejects.toThrow(
    /Close native/,
  );
  await turns.close();
  expect(turn.state.phase).toBe("closed");
  await workspace.changeStorage(async () => {});
  await workspace.close();
});
